<?php
$host = "localhost";
$user = "root";
$pass = "";
$db   = "chantikdb";

$conn = new mysqli($host, $user, $pass, $db);
if ($conn->connect_error) die("Koneksi gagal");

$username = $_POST['username'];
$password = password_hash($_POST['password'], PASSWORD_DEFAULT);

// ❌ Cek apakah username sudah dipakai
$check = $conn->query("SELECT * FROM users WHERE username = '$username'");
if ($check->num_rows > 0) {
  // Kirim alert ke user
  echo "<script>
    alert('❌ Username yang Anda gunakan sudah terdaftar. Silakan pilih yang lain.');
    window.location.href = 'register.html';
  </script>";
  exit;
}

// ✅ Simpan user baru
$stmt = $conn->prepare("INSERT INTO users (username, password) VALUES (?, ?)");
$stmt->bind_param("ss", $username, $password);

if ($stmt->execute()) {
  echo "<script>
    alert('✅ Pendaftaran berhasil! Silakan login.');
    window.location.href = 'login.html';
  </script>";
} else {
  echo "Gagal daftar: " . $conn->error;
}

$conn->close();
?>
