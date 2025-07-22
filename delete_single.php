<?php
ini_set("display_errors", 0);
header("Content-Type: application/json");

$data = json_decode(file_get_contents("php://input"), true);
$username = $data["username"] ?? null;
$message = $data["message"] ?? null;

if (!$username || !$message) {
  echo json_encode(["status" => "error", "message" => "Username and message required"]);
  exit;
}

require_once "db.php";

$sql = "DELETE FROM chatlogs WHERE username = ? AND answer = ?";
$stmt = $conn->prepare($sql);
$stmt->bind_param("ss", $username, $message);

if ($stmt->execute()) {
  echo json_encode(["status" => "success"]);
} else {
  echo json_encode(["status" => "error", "message" => $stmt->error]);
}
?>
