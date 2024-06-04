// UPLOADING TO AWS S3
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });
const Upload = require('s3-uploader');

const client = new Upload(process.env.S3_BUCKET, {
	aws: {
		path: 'pets/avatar',
		region: process.env.S3_REGION,
		acl: 'public-read',
		accessKeyId: process.env.AWS_ACCESS_KEY_ID,
		secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
	},
	cleanup: {
		versions: true,
		original: true,
	},
	versions: [
		{
			maxWidth: 400,
			aspect: '16:10',
			suffix: '-standard',
		},
		{
			maxWidth: 300,
			aspect: '1:1',
			suffix: '-square',
		},
	],
});

const mailer = require('../utils/mailer');

// MODELS
const Pet = require('../models/pet');

// PET ROUTES
module.exports = (app) => {
	// INDEX PET => index.js

	// NEW PET
	app.get('/pets/new', (req, res) => {
		res.render('pets-new');
	});

	// CREATE PET
	app.post('/pets', upload.single('avatar'), (req, res, next) => {
		var pet = new Pet(req.body);
		pet.save(function (err) {
			if (req.file) {
				// Upload the images
				client.upload(req.file.path, {}, function (err, versions, meta) {
					if (err) {
						return res.status(400).send({ err: err });
					}

					// Pop off the -square and -standard and just use the one URL to grab the image
					versions.forEach(function (image) {
						var urlArray = image.url.split('-');
						urlArray.pop();
						var url = urlArray.join('-');
						pet.avatarUrl = url;
						pet.save();
					});

					res.send({ pet: pet });
				});
			} else {
				res.send({ pet: pet });
			}
		});
	});

	// SEARCH PET
	app.get('/search', (req, res) => {
		term = new RegExp(req.query.term, 'i');

		const page = req.query.page || 1;
		Pet.paginate(
			{
				$or: [{ name: term }, { species: term }],
			},
			{ page: page }
		).then((results) => {
			res.render('pets-index', {
				pets: results.docs,
				pagesCount: results.pages,
				currentPage: page,
			});
		});
	});

	// SHOW PET
	app.get('/pets/:id', (req, res) => {
		Pet.findById(req.params.id).exec((err, pet) => {
			res.render('pets-show', { pet: pet });
		});
	});

	// EDIT PET
	app.get('/pets/:id/edit', (req, res) => {
		Pet.findById(req.params.id).exec((err, pet) => {
			res.render('pets-edit', { pet: pet });
		});
	});

	// UPDATE PET
	app.put('/pets/:id', (req, res) => {
		Pet.findByIdAndUpdate(req.params.id, req.body)
			.then((pet) => {
				res.redirect(`/pets/${pet._id}`);
			})
			.catch((err) => {
				// Handle Errors
			});
	});

	// DELETE PET
	app.delete('/pets/:id', (req, res) => {
		Pet.findByIdAndRemove(req.params.id).exec((err, pet) => {
			return res.redirect('/');
		});
	});

	// PURCHASE PET
	app.post('/pets/:id/purchase', (req, res) => {
		var stripe = require('stripe')(process.env.PRIVATE_STRIPE_API_KEY);
		const token = req.body.stripeToken;
		let petId = req.body.petId || req.params.id;

		Pet.findById(petId).exec((err, pet) => {
			if (err) {
				console.log('Error: ', err);
				res.redirect(`pets/${req.params.id}`);
			}
			const charge = stripe.charges
				.create({
					amount: pet.price * 100,
					currency: 'usd',
					description: `Purchased ${pet.name}, ${pet.species}`,
					source: token,
				})
				.then((chg) => {
					const user = {
						email: req.body.stripeEmail,
						amount: chg.amount / 100,
						petName: pet.name,
					};
					mailer.sendMail(user, req, res);
					res.redirect(`/pets/${req.params.id}`);
				})
				.catch((err) => {
					console.log('Error: ', err);
				});
		});
	});
};
