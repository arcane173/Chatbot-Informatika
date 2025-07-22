<?php
session_start();
require 'db.php';

if (!isset($_SESSION['username']) || $_SESSION['username'] !== 'admin') {
    header('Location: login.html');
    exit();
}

$sql = "SELECT * FROM chatlogs ORDER BY timestamp DESC";
$result = $conn->query($sql);

$statQuery = "SELECT DATE(timestamp) as tanggal, COUNT(*) as jumlah FROM chatlogs GROUP BY tanggal ORDER BY tanggal DESC LIMIT 7";
$statResult = $conn->query($statQuery);

$labels = [];
$data = [];
while ($row = $statResult->fetch_assoc()) {
    $labels[] = $row['tanggal'];
    $data[] = $row['jumlah'];
}
?>

<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>Admin Dashboard - Chantik</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700&display=swap" rel="stylesheet">
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
  <style>
    * {
      box-sizing: border-box;
    }

    html, body {
      margin: 0;
      padding: 0;
      min-height: 100vh;
      overflow-x: hidden;
      font-family: 'Inter', sans-serif;
      background: #f5f7fa;
      color: #333;
      transition: background 0.3s, color 0.3s;
    }

    body.dark-mode {
      background: #1e1e1e;
      color: #eee;
    }

    header {
      background-color: #2c3e50;
      color: white;
      padding: 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    h1 {
      margin: 0;
      font-size: 20px;
    }

    .actions {
      display: flex;
      gap: 10px;
      align-items: center;
    }

    .logout-btn, .theme-toggle {
      padding: 8px 14px;
      border: none;
      border-radius: 6px;
      color: white;
      font-weight: bold;
      cursor: pointer;
    }

    .logout-btn {
      background: #e74c3c;
    }

    .logout-btn:hover {
      background: #c0392b;
    }

    .theme-toggle {
      background: #3498db;
    }

    .theme-toggle:hover {
      background: #2980b9;
    }

    main {
      padding: 20px;
      width: 100%;
      overflow-x: auto;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      background: white;
      border-radius: 10px;
      overflow: hidden;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
    }

    body.dark-mode table {
      background: #2a2a2a;
    }

    th, td {
      padding: 12px;
      border-bottom: 1px solid #ddd;
      vertical-align: top;
      text-align: left;
    }

    th {
      background-color: #34495e;
      color: white;
    }

    body.dark-mode th {
      background-color: #111;
      color: #eee;
    }

    tr:hover {
      background-color: #f1f1f1;
    }

    body.dark-mode tr:hover {
      background-color: #333;
    }

    .chart-container {
      max-width: 800px;
      margin: 20px auto;
      background: white;
      padding: 20px;
      border-radius: 12px;
      box-shadow: 0 2px 6px rgba(0,0,0,0.1);
    }

    body.dark-mode .chart-container {
      background: #2a2a2a;
    }
  </style>
</head>
<body>
  <header>
    <h1>📊 Admin Dashboard</h1>
    <div class="actions">
      <button class="theme-toggle" onclick="toggleTheme()">🌙 Mode Gelap</button>
      <form action="logout.php" method="post">
        <button class="logout-btn" type="submit">Logout</button>
      </form>
    </div>
  </header>

  <main>
    <div class="chart-container">
      <h2 style="text-align:center">Statistik Pertanyaan</h2>
      <canvas id="statistikChart"></canvas>
    </div>

    <table>
      <tr>
        <th>No</th>
        <th>Username</th>
        <th>Pertanyaan</th>
        <th>Jawaban</th>
        <th>Waktu</th>
      </tr>
      <?php
      $no = 1;
      if ($result->num_rows > 0) {
          while($row = $result->fetch_assoc()) {
              echo "<tr>
                  <td>{$no}</td>
                  <td>{$row['username']}</td>
                  <td>{$row['question']}</td>
                  <td>{$row['answer']}</td>
                  <td>{$row['timestamp']}</td>
              </tr>";
              $no++;
          }
      } else {
          echo "<tr><td colspan='5'>Belum ada data chat.</td></tr>";
      }
      ?>
    </table>
  </main>

  <script>
    const body = document.body;
    const themeToggle = document.querySelector('.theme-toggle');

    function toggleTheme() {
      body.classList.toggle('dark-mode');
      const isDark = body.classList.contains('dark-mode');
      themeToggle.textContent = isDark ? '☀️ Mode Terang' : '🌙 Mode Gelap';
      localStorage.setItem('admin_theme', isDark ? 'dark' : 'light');
    }

    window.onload = () => {
      const savedTheme = localStorage.getItem('admin_theme');
      if (savedTheme === 'dark') {
        body.classList.add('dark-mode');
        themeToggle.textContent = '☀️ Mode Terang';
      }
    }

    const ctx = document.getElementById('statistikChart').getContext('2d');
    const chart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: <?= json_encode(array_reverse($labels)) ?>,
        datasets: [{
          label: 'Jumlah Pertanyaan',
          data: <?= json_encode(array_reverse($data)) ?>,
          backgroundColor: '#3498db'
        }]
      },
      options: {
        responsive: true,
        scales: {
          y: { beginAtZero: true }
        }
      }
    });
  </script>
</body>
</html>
