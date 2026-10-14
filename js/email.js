(function(){
  var u='angelang1201',d='gmail.com';
  document.addEventListener('click',function(e){
    var el=e.target.closest('[data-contact]');
    if(el){e.preventDefault();window.location.href='mail'+'to:'+u+'@'+d;}
  });
  var pb=document.getElementById('print-btn');
  if(pb){pb.addEventListener('click',function(){window.print();});}
})();
