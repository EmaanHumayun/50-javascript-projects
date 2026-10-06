let count = 0;

const countDisplay = document.getElementById("count");
const statusText = document.getElementById("statusText");


function updateDisplay() {

    countDisplay.textContent = count;

    countDisplay.style.transform = "scale(1.08)";

    setTimeout(() => {
        countDisplay.style.transform = "scale(1)";
    }, 150);
}


function increaseCount() {

    count++;

    updateDisplay();

    statusText.textContent = "Counter increased";
}


function decreaseCount() {

    count--;

    updateDisplay();

    statusText.textContent = "Counter decreased";
}


function resetCount() {

    count = 0;

    updateDisplay();

    statusText.textContent = "Counter reset";
}


lucide.createIcons();