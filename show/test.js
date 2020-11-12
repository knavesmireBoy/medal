var gal = document.querySelector('.gallery'),
    body = document.body;



gal.addEventListener('click', function(e){
    e.preventDefault();
    if(!e.target.nodeName.match(/img/i)){
        return;
    }
    
    body.classList.add('showtime');
    

});