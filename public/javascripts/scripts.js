if (document.querySelector('#new-pet')) {
  document.querySelector('#new-pet').addEventListener('submit', (e) => {
      e.preventDefault();

      var form = document.getElementById('new-pet');
      var pet = new FormData(form);

      axios.post('/pets', pet, {
          headers: {
              'Content-Type': 'multipart/form-data'
          }
      })
          .then(function (res) {
              window.location.replace(`/pets/${res.data.pet._id}`);
          })
          .catch(function (err) {
              const alert = document.getElementById('alert');
              alert.classList.add('alert-warning');
              alert.textContent = 'Oops, something went wrong saving your pet. Please check your information and try again:)';
              alert.style.display = 'block';
              setTimeout(() => {
                  alert.style.display = 'none';
                  alert.classList.remove('alert-warning');
              }, 3000);
          });
  })
}