require('dotenv').config();

const admin = require('firebase-admin');

const saltRounds = 10;

const serviceAccount = require('./otwlah_permissions.json');
admin.initializeApp({
	credential: admin.credential.cert(serviceAccount),
	databaseURL:
		'https://otwlah-default-rtdb.asia-southeast1.firebasedatabase.app',
});

const db = admin.firestore();

const nodeMailer = require('nodemailer');
const bCrypt = require('bcryptjs');

const express = require('express');
const app = express();
const port = 3000;

const cors = require('cors');

const sessionsMap = {};

app.use(cors({ origin: true, credentials: true }));
app.use(function (req, res, next) {
	res.setHeader('Access-Control-Allow-Origin', '*');
	res.setHeader('Access-Control-Allow-Credentials', 'true');
	res.setHeader(
		'Access-Control-Allow-Methods',
		'GET,HEAD,OPTIONS,POST,PUT,DELETE'
	);
	res.setHeader(
		'Access-Control-Allow-Headers',
		'Origin,Cache-Control,Accept,X-Access-Token ,X-Requested-With, Content-Type, Access-Control-Request-Method'
	);
	if (req.method === 'OPTIONS') {
		return res.status(200).end();
	}
	next();
});

const server = app.listen(port);
const io = require('socket.io')().listen(server);

//socket
io.on('connection', (socket) => {
	const userId = socket.handshake.query['userId'];
	sessionsMap[userId] = socket.id;

	socket.on('joinParty', (partyID, user) => {
		console.log(partyID);
		socket.join(partyID);
		io.sockets.emit(partyID, user, 'joined');
	});

	socket.on('leaveParty', (partyID, uid) => {
		socket.leave(partyID);
		io.sockets.emit(partyID, uid, 'left');
	});

	socket.on('partyEdited', (partyID) => {
		io.sockets.emit(partyID, 'partyEdited');
	});

	socket.on('locationUpdated', (partyID, uid, lat, lng) => {
		io.sockets.emit(partyID, 'locationUpdate', uid, lat, lng);
	});

	socket.on('notification', (partyID, uid) => {
		io.to(sessionsMap[uid]).emit('notification', partyID);
	});

	socket.on('disconnect', () => {});
});

//nodemailer
const transporter = nodeMailer.createTransport({
	host: 'smtp.zoho.com',
	port: 465,
	secure: true,
	auth: {
		user: process.env.AUTH_EMAIL,
		pass: process.env.AUTH_PASS,
	},
});

const sendOTPVerificationEmail = async ({ username, email }, res) => {
	try {
		const otp = `${Math.floor(100000 + Math.random() * 900000)}`;

		const mailOptions = {
			from: process.env.AUTH_EMAIL,
			to: email,
			subject: 'OTWLah - OTP Verification',
			html: `<div style="font-family: Helvetica,Arial,sans-serif;min-width:1000px;overflow:auto;line-height:2">
			<div style="margin:50px auto;width:70%;padding:20px 0">
			  <div style="border-bottom:1px solid #eee">
				<a href="" style="font-size:1.4em;color: #00466a;text-decoration:none;font-weight:600">OTW Lah</a>
			  </div>
			  <p style="font-size:1.1em">Hi ${username},</p>
			  <p>Thank you for using OTW Lah. Use the following OTP to complete your Sign Up or Change Password. <br>OTP is valid for 5 minutes</p>
			  <h2 style="background: #00466a;margin: 0 auto;width: max-content;padding: 0 10px;color: #fff;border-radius: 4px;">${otp}</h2>
			  <p style="font-size:0.9em;">Regards,<br />OTW Lah</p>
			  <hr style="border:none;border-top:1px solid #eee" />
			  <div style="float:right;padding:8px 0;color:#aaa;font-size:0.8em;line-height:1;font-weight:300">
				<p>OTW Lah</p>
			  </div>
			</div>
		  </div>`,
		};

		//hash the otp
		const hashedOTP = await bCrypt.hash(otp, saltRounds);

		await transporter.sendMail(mailOptions);

		await db
			.collection('otp_verification')
			.doc(email)
			.set({
				username: username,
				otp: hashedOTP,
				status: 'PENDING',
				created_at: Date.now(),
				expires_at: Date.now() + 300000,
			});

		res.json({
			status: 'PENDING',
			message: 'Verification OTP email sent',
			data: {
				email: email,
				username: username,
			},
		});
	} catch (error) {
		res.json({
			status: 'FAILED',
			message: error.message,
		});
	}
};

// Get OTP
app.get('/requestOTP', (req, res) => {
	sendOTPVerificationEmail(req.query, res);
});

// Resend OTP
app.get('/resendOTP', (req, res) => {
	sendOTPVerificationEmail(req.query, res);
});

app.get('/', (req, res) => {
	res.send('Hello World');
});

// Verify OTP
app.get('/verifyOTP', async (req, res) => {
	try {
		const { email, otp } = req.query;

		const docRef = db.collection('otp_verification').doc(email);
		const doc = await docRef.get();

		if (!doc.exists) {
			throw new Error('System Error. Please try again later.');
		} else {
			const otpDoc = doc.data();
			if (otpDoc.expires_at < Date.now()) {
				throw new Error('OTP has expired. Please request a new one.');
			}

			const isOTPValid = bCrypt.compare(otp, otpDoc.otp);

			if (isOTPValid) {
				res.json({
					status: 'SUCCESS',
					message: 'OTP is valid',
					data: {
						email: email,
						username: otpDoc.username,
					},
				});
			} else {
				throw new Error('Invalid OTP');
			}
		}
	} catch (error) {
		res.json({
			status: 'FAILED',
			message: error.message,
		});
	}
});

// Send Reset Password Email
app.get('/sendResetPasswordEmail', async (req, res) => {
	sendOTPVerificationEmail(req.query, res);
});

// Reset Password
app.get('/resetPassword', async (req, res) => {
	const { email, password } = req.query;
	try {
		const user = await admin.auth().getUserByEmail(email);
		await admin.auth().updateUser(user.uid, {
			password: password,
		});
		res.json({
			status: 'SUCCESS',
			message: 'Password reset successfully',
		});
	} catch (error) {
		res.json({
			status: 'FAILED',
			message: 'Failed to reset password. Please try again later.',
		});
	}
});

// Join Party
app.get('/joinParty', async (req, res) => {
	let doc;
	try {
		const { partyID, userID, username, avatar, lat, lng } = req.query;
		const docRef = db.collection('parties').doc(partyID.toString());
		doc = await docRef.get();

		if (!doc.exists) {
			throw new Error('Party does not exist');
		} else {
			const partyRef = db
				.collection('parties')
				.doc(partyID.toString())
				.collection('members')
				.doc(userID);
			await partyRef.create({
				username: username,
				joinedAt: Date.now(),
				isLeader: false,
				avatar: avatar,
				destination: {
					name: doc.data().destination.name,
					address: doc.data().destination.address,
					latitude: doc.data().destination.lat,
					longitude: doc.data().destination.lng,
				},
				createdAt: doc.data().createdAt,
				arrivalTime: doc.data().arrivalTime,
				currentLocation: {
					lat: parseFloat(lat),
					lng: parseFloat(lng),
				},
				partyID: partyID,
				uid: userID,
			});

			res.json({
				status: 'SUCCESS',
				message: 'Party joined successfully',
				data: {
					destination: doc.data().destination,
					arrivalTime: doc.data().arrivalTime,
				},
			});
		}
	} catch (error) {
		if (error.message.startsWith('6 ALREADY_EXISTS')) {
			res.json({
				status: 'SUCCESS',
				message: 'You are already in this party',
				data: {
					destination: doc.data().destination,
					arrivalTime: doc.data().arrivalTime,
				},
			});
		} else {
			res.json({
				status: 'FAILED',
				message: error.message,
			});
		}
	}
});
