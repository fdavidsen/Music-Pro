$('.password i').on('click', function() {
  if ($('.password input').attr('type') === 'password') {
    $('.password input').attr('type', 'text');
    $('.password i').removeClass('fa-eye-slash').addClass('fa-eye');
  } else {
    $('.password input').attr('type', 'password');
    $('.password i').removeClass('fa-eye').addClass('fa-eye-slash');
  }
});