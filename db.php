<?php
$host = "localhost";
$user = "root";
$pass = "";
$db = "chantikdb"; // pastikan nama database ini sesuai

$conn = new mysqli($host, $user, $pass, $db);

if ($conn->connect_error) {
  die("Connection failed: " . $conn->connect_error);
}
?>
