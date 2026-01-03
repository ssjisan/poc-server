const webMessage = `
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Server Status</title>
    <link rel="icon" href="https://fonts.gstatic.com/s/e/notoemoji/latest/1f680/512.webp" type="image/webp">
    <style>
      /* Reset */
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }

      body {
        height: 100vh;
        display: flex;
        justify-content: center;
        align-items: center;
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        background-color: #0a0a0a;
        color: #fff;
      }

      .container {
        background: #1a1a1a;
        padding: 50px 60px;
        border-radius: 20px;
        text-align: center;
        box-shadow: 0 0 40px rgba(0, 255, 255, 0.2);
        max-width: 400px;
        width: 90%;
        border: 1px solid #00fff7;
      }

      .icon {
        width: 80px;
        height: 80px;
        margin-bottom: 20px;
        animation: bounce 1.5s infinite;
        filter: drop-shadow(0 0 10px #00fff7);
      }

      h1 {
        font-size: 2rem;
        margin-bottom: 10px;
        color: #00fff7;
        text-shadow: 0 0 10px #00fff7;
      }

      p {
        font-size: 1rem;
        color: #a0f0f5;
      }

      @keyframes bounce {
        0%, 20%, 50%, 80%, 100% {
          transform: translateY(0);
        }
        40% {
          transform: translateY(-15px);
        }
        60% {
          transform: translateY(-8px);
        }
      }
    </style>
  </head>
  <body>
    <div class="container">
      <img class="icon" src="https://fonts.gstatic.com/s/e/notoemoji/latest/1f680/512.webp" alt="🚀" />
      <h1>Server is running!</h1>
      <p>Your backend is live and ready to serve requests 🚀</p>
    </div>
  </body>
</html>
`;

module.exports = webMessage;
