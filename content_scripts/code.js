var elements = document.getElementsByClassName("header-nav-item");
while(elements.length > 0){
    elements[0].parentNode.removeChild(elements[0]);
}

var element = document.getElementById("topchapter");
element.parentNode.removeChild(element);
