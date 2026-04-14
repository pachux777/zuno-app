let gender = "other";

function setGender(g) {
  gender = g;
  console.log("Gender:", gender);
}

function enter() {
  const name = document.getElementById("name").value;
  const age = document.getElementById("age").value;

  if (!name || !age) {
    alert("Fill all fields");
    return;
  }

  if (age < 18) {
    alert("You must be 18+");
    return;
  }

  localStorage.setItem("name", name);
  localStorage.setItem("gender", gender);

  alert("Login Success ✅");

  // later connect to server
}
