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
	app.post('/pets', (req, res) => {
		var pet = new Pet(req.body);

		pet
			.save()
			.then((pet) => {
				res.send({ pet: pet });
			})
			.catch((err) => {
				// STATUS OF 400 FOR VALIDATIONS
				res.status(400).send(err.errors);
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
};
