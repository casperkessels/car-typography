var requestURL = './data.json';
var request = new XMLHttpRequest();
request.open('GET', requestURL);





request.responseType = 'json';
request.send();

request.onload = function() {
    const data = request.response;
    console.log(data.Make)
    console.log(data)
    // populateImagecontainer(data);
    // populateHeader(superHeroes);
    // console.log(data);
    // showHeroes(superHeroes);

    for (var i = 0; i < data.length; i++) {
        var obj = data[i];
        var imagecontainer = document.getElementById("imagecontainer");
        var img = document.createElement("img");
        img.src = obj.Img;
        imagecontainer.appendChild(img);
        selectmake = document.getElementById("selectmake");
        var option = document.createElement("option");
        option.value = obj.Make;
        option.text = obj.Make;
        selectmake.appendChild(option);


    }
}



