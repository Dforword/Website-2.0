document.getElementById('contact-submit').addEventListener('click', async function () {
  var btn = this;
  var form = document.getElementById('contact-form');
  var formBlock = form.closest('.form-block');
  var successDiv = formBlock.querySelector('.w-form-done');
  var errorDiv = formBlock.querySelector('.w-form-fail');

  var name = document.getElementById('contact-name').value.trim();
  var email = document.getElementById('contact-email').value.trim();
  var message = document.getElementById('contact-message').value.trim();

  successDiv.style.display = 'none';
  errorDiv.style.display = 'none';

  if (!email || !message) {
    errorDiv.querySelector('div').textContent = 'Please provide your email and a message.';
    errorDiv.style.display = 'block';
    return;
  }

  btn.disabled = true;
  btn.textContent = 'Sending...';

  try {
    var res = await fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name, email: email, message: message, page: window.location.pathname })
    });
    if (res.ok) {
      form.style.display = 'none';
      successDiv.style.display = 'block';
    } else {
      var data = await res.json();
      errorDiv.querySelector('div').textContent = data.error || 'Something went wrong. Please try again.';
      errorDiv.style.display = 'block';
    }
  } catch (e) {
    errorDiv.querySelector('div').textContent = 'Network error. Please try again.';
    errorDiv.style.display = 'block';
  } finally {
    btn.disabled = false;
    btn.textContent = 'Send message';
  }
});
