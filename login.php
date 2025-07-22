<?php
session_start();

$host = "localhost";
$user = "root";
$pass = "";
$db   = "chantikdb";

$conn = new mysqli($host, $user, $pass, $db);
if ($conn->connect_error) die("Koneksi gagal: " . $conn->connect_error);

$username = $_POST['username'];
$password = $_POST['password'];

$result = $conn->query("SELECT * FROM users WHERE username = '$username'");
if ($result->num_rows === 1) {
    $user = $result->fetch_assoc();

    if (password_verify($password, $user['password'])) {
        $_SESSION['username'] = $username;

        if ($username === 'admin') {
            echo "<script>
                localStorage.setItem('chantik_username', '$username');
                window.location.href = 'admin.php';
            </script>";
        } else {
            echo "<script>
                localStorage.setItem('chantik_username', '$username');
                window.location.href = 'index.html';
            </script>";
        }
        exit;
    }
}

echo "Login gagal. <a href='login.html'>Coba lagi</a>";

$conn->close();
?>
