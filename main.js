document.querySelector(".magic_button").onclick = () => {

    let my_val = document.querySelector('.some_input').value

    //console.log(my_val)
    document.querySelector('.log').innerHTML += my_val + '<br>'
}

