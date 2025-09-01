/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/ClientSide/javascript.js to edit this template
 */

// this one is jut to wait for the page to load
function w3_open() {
  document.getElementById("mySidebar").style.display = "block";
}

function w3_close() {
  document.getElementById("mySidebar").style.display = "none";

}

// JavaScript to toggle between themes
const themeStylesheet = document.getElementById('theme');
let currentTheme = 'light'; // Default to light theme

function toggleTheme() {
  const body = document.body;
  const themeToggleButtons = document.querySelectorAll('#theme-toggle-nav, #theme-toggle-side');

    if (currentTheme === 'dark') {
      themeStylesheet.href = './light-theme.css';
      body.style.backgroundColor = '#ffffff';
      body.style.color = '#1e1e1e'; // Light mode background
      currentTheme = 'light';
    } else {
      themeStylesheet.href = './dark-theme.css';
      body.style.backgroundColor = '#1e1e1e';
      body.style.color = '#ffffff'; // Dark mode background
      currentTheme = 'dark';
    }
    themeToggleButtons.forEach(button => {
      button.textContent = currentTheme === 'dark' ? 'LIGHT' : 'DARK'; // Update button text
    });
  }

// Function to set the theme
function setTheme(theme) {
  const body = document.body;
  if (theme === 'dark') {
    themeStylesheet.href = 'dark-theme.css';
    body.style.backgroundColor = '#1e1e1e';
    body.style.color = '#ffffff'; // Dark mode background
    currentTheme = 'dark';
  } else {
    themeStylesheet.href = 'light-theme.css';
    body.style.backgroundColor = '#ffffff';
    body.style.color = '#1e1e1e'; // Light mode background
    currentTheme = 'light';
  }
}

// Set the initial theme on page load
document.addEventListener('DOMContentLoaded', () => {
  setTheme(currentTheme); // Set the initial theme
});
