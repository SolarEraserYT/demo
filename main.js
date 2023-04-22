// send data function
function send_data() {
    //get input value
    let my_val = document.querySelector('.some_input').value
    let my_log_box = document.querySelector('.log')
    //add input value to log and a <br>
    my_log_box.innerHTML += my_val + '<br>'
    // scroll the log div to end
    my_log_box.scrollTop = my_log_box.scrollHeight
    //clear the input 
    document.querySelector('.some_input').value = ''
}

//button click event - on click send_data
document.querySelector(".magic_button").onclick = () => send_data()

//input on key press event - if key is Enter send_data
document.querySelector('.some_input')?.addEventListener('keypress', e => {
    if (e.key === 'Enter') send_data()
})


