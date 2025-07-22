<?php
$host = "localhost";
$user = "root";
$pass = "";
$db   = "chantikdb";

$conn = new mysqli($host, $user, $pass, $db);
if ($conn->connect_error) {
  http_response_code(500);
  echo "Database connection failed";
  exit;
}

$username = $conn->real_escape_string($_GET['username'] ?? '');

$sql = "SELECT question, answer, timestamp FROM chatlogs WHERE username = '$username' ORDER BY id ASC";
$result = $conn->query($sql);

$chat = [];
while ($row = $result->fetch_assoc()) {
  $chat[] = $row;
}

header('Content-Type: application/json');
echo json_encode($chat);

$conn->close();
?>
