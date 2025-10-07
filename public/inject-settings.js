;(() => {
  // Create container
  const container = document.createElement("div")
  container.id = "settings-icon-container"

  // Create button
  const button = document.createElement("button")
  button.innerHTML = "⚙️"
  button.setAttribute("aria-label", "Settings")
  button.style.position = "fixed"
  button.style.top = "20px"
  button.style.right = "20px"
  button.style.zIndex = "9999"
  button.style.width = "50px"
  button.style.height = "50px"
  button.style.borderRadius = "50%"
  button.style.backgroundColor = "#000"
  button.style.color = "#fff"
  button.style.display = "flex"
  button.style.alignItems = "center"
  button.style.justifyContent = "center"
  button.style.fontSize = "24px"
  button.style.cursor = "pointer"
  button.style.border = "2px solid white"
  button.style.boxShadow = "0 4px 8px rgba(0,0,0,0.2)"

  // Add button to container
  container.appendChild(button)

  // Add container to body
  document.body.appendChild(container)

  // Add click event
  button.addEventListener("click", () => {
    alert("Settings menu clicked!")
  })
})()
