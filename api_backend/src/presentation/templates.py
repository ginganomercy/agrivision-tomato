"""
AgriVision API Presentation Templates
Menyediakan HTML/CSS modern untuk Developer Portal (/) dan Custom Dark Swagger UI (/docs).
"""

def render_swagger_docs_html(title: str = "AgriVision API Documentation", openapi_url: str = "/openapi.json") -> str:
    """Menghasilkan Swagger UI dengan tema Dark Glassmorphism dan typography modern."""
    return f"""<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{title}</title>
  <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🍅</text></svg>">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&family=Outfit:wght@300;400;500;600;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" type="text/css" href="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui.css">
  <style>
    :root {{
      --bg-primary: #090D16;
      --bg-secondary: #0F172A;
      --bg-card: rgba(15, 23, 42, 0.75);
      --border-color: rgba(255, 255, 255, 0.08);
      --accent-tomato: #F43F5E;
      --accent-emerald: #10B981;
      --accent-sky: #38BDF8;
      --text-main: #F1F5F9;
      --text-muted: #94A3B8;
    }}

    * {{
      box-sizing: border-box;
      font-family: 'Outfit', sans-serif !important;
    }}

    body {{
      margin: 0;
      padding: 0;
      background-color: var(--bg-primary);
      background-image: 
        radial-gradient(circle at 15% 10%, rgba(244, 63, 94, 0.12) 0%, transparent 40%),
        radial-gradient(circle at 85% 20%, rgba(16, 185, 129, 0.10) 0%, transparent 40%),
        radial-gradient(circle at 50% 90%, rgba(56, 189, 248, 0.08) 0%, transparent 50%);
      color: var(--text-main);
      min-height: 100vh;
    }}

    /* Custom Topbar */
    .custom-navbar {{
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px 32px;
      background: rgba(9, 13, 22, 0.85);
      backdrop-filter: blur(16px);
      border-bottom: 1px solid var(--border-color);
      position: sticky;
      top: 0;
      z-index: 100;
    }}

    .custom-brand {{
      display: flex;
      align-items: center;
      gap: 12px;
      text-decoration: none;
      color: #FFF;
    }}

    .custom-brand .logo-icon {{
      font-size: 28px;
      filter: drop-shadow(0 0 12px rgba(244, 63, 94, 0.5));
    }}

    .custom-brand .title {{
      font-size: 20px;
      font-weight: 700;
      background: linear-gradient(135deg, #FFF 30%, #F43F5E 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      letter-spacing: -0.5px;
    }}

    .custom-nav-links {{
      display: flex;
      align-items: center;
      gap: 16px;
    }}

    .badge-status {{
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background: rgba(16, 185, 129, 0.15);
      border: 1px solid rgba(16, 185, 129, 0.3);
      color: #34D399;
      font-size: 13px;
      font-weight: 600;
      padding: 6px 14px;
      border-radius: 9999px;
    }}

    .badge-status .dot {{
      width: 8px;
      height: 8px;
      background-color: #10B981;
      border-radius: 50%;
      box-shadow: 0 0 8px #10B981;
      animation: pulse 2s infinite;
    }}

    @keyframes pulse {{
      0%, 100% {{ transform: scale(1); opacity: 1; }}
      50% {{ transform: scale(1.3); opacity: 0.6; }}
    }}

    .nav-btn {{
      padding: 8px 18px;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid var(--border-color);
      border-radius: 10px;
      color: #E2E8F0;
      text-decoration: none;
      font-size: 14px;
      font-weight: 500;
      transition: all 0.2s ease;
    }}

    .nav-btn:hover {{
      background: rgba(244, 63, 94, 0.15);
      border-color: rgba(244, 63, 94, 0.4);
      color: #FFF;
      transform: translateY(-1px);
    }}

    /* Swagger UI Overrides */
    .swagger-ui {{
      max-width: 1200px;
      margin: 0 auto;
      padding: 24px 20px;
      color: var(--text-main);
    }}

    .swagger-ui .topbar {{ display: none !important; }}

    .swagger-ui .info {{
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: 16px;
      padding: 32px;
      backdrop-filter: blur(12px);
      margin-bottom: 24px;
    }}

    .swagger-ui .info .title {{
      color: #FFF !important;
      font-size: 32px !important;
      font-weight: 700 !important;
      letter-spacing: -0.5px;
    }}

    .swagger-ui .info .title small {{
      background: var(--accent-tomato) !important;
      color: #FFF !important;
      font-size: 13px !important;
      padding: 4px 10px !important;
      border-radius: 8px !important;
      vertical-align: middle;
      font-weight: 600;
    }}

    .swagger-ui .info p, .swagger-ui .info li {{
      color: var(--text-muted) !important;
      font-size: 15px !important;
      line-height: 1.6;
    }}

    .swagger-ui .scheme-container {{
      background: transparent !important;
      box-shadow: none !important;
      padding: 0 !important;
      margin: 0 0 20px 0 !important;
    }}

    /* Operation Blocks */
    .swagger-ui .opblock {{
      background: var(--bg-card) !important;
      border: 1px solid var(--border-color) !important;
      border-radius: 14px !important;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2) !important;
      margin: 0 0 16px 0 !important;
      backdrop-filter: blur(8px);
      transition: border-color 0.2s ease;
    }}

    .swagger-ui .opblock:hover {{
      border-color: rgba(255, 255, 255, 0.2) !important;
    }}

    .swagger-ui .opblock.opblock-post {{
      border-left: 4px solid var(--accent-tomato) !important;
    }}

    .swagger-ui .opblock.opblock-get {{
      border-left: 4px solid var(--accent-emerald) !important;
    }}

    .swagger-ui .opblock-summary {{
      padding: 14px 20px !important;
    }}

    .swagger-ui .opblock-summary-method {{
      border-radius: 8px !important;
      font-weight: 700 !important;
      font-size: 13px !important;
      min-width: 75px !important;
      text-shadow: none !important;
    }}

    .swagger-ui .opblock-post .opblock-summary-method {{
      background: var(--accent-tomato) !important;
    }}

    .swagger-ui .opblock-get .opblock-summary-method {{
      background: var(--accent-emerald) !important;
    }}

    .swagger-ui .opblock-summary-path {{
      color: #F8FAFC !important;
      font-weight: 600 !important;
      font-size: 15px !important;
      font-family: 'JetBrains Mono', monospace !important;
    }}

    .swagger-ui .opblock-summary-description {{
      color: var(--text-muted) !important;
      font-size: 14px !important;
    }}

    .swagger-ui .opblock-body {{
      background: rgba(11, 15, 25, 0.6) !important;
      border-top: 1px solid var(--border-color) !important;
      padding: 24px !important;
    }}

    .swagger-ui table thead tr th, 
    .swagger-ui table thead tr td {{
      color: var(--text-muted) !important;
      border-bottom: 1px solid var(--border-color) !important;
      font-size: 13px !important;
    }}

    .swagger-ui .parameters-col_name,
    .swagger-ui .parameter__name {{
      color: #E2E8F0 !important;
      font-family: 'JetBrains Mono', monospace !important;
      font-size: 14px !important;
    }}

    .swagger-ui .parameter__type {{
      color: var(--accent-sky) !important;
      font-family: 'JetBrains Mono', monospace !important;
      font-size: 12px !important;
    }}

    .swagger-ui input[type="text"], 
    .swagger-ui input[type="file"],
    .swagger-ui select {{
      background: #090D16 !important;
      border: 1px solid var(--border-color) !important;
      color: #FFF !important;
      border-radius: 8px !important;
      padding: 8px 12px !important;
      font-size: 14px !important;
    }}

    .swagger-ui .btn {{
      border-radius: 8px !important;
      font-weight: 600 !important;
      font-size: 13px !important;
      transition: all 0.2s ease !important;
    }}

    .swagger-ui .btn.execute {{
      background: linear-gradient(135deg, #F43F5E, #E11D48) !important;
      border: none !important;
      color: #FFF !important;
      box-shadow: 0 4px 14px rgba(244, 63, 94, 0.4) !important;
    }}

    .swagger-ui .btn.try-out__btn {{
      background: rgba(255, 255, 255, 0.08) !important;
      border: 1px solid var(--border-color) !important;
      color: #FFF !important;
    }}

    .swagger-ui .responses-inner h4, 
    .swagger-ui .responses-inner h5 {{
      color: #FFF !important;
    }}

    .swagger-ui .response-col_status {{
      color: #38BDF8 !important;
      font-family: 'JetBrains Mono', monospace !important;
    }}

    .swagger-ui .response-col_description {{
      color: var(--text-muted) !important;
    }}

    .swagger-ui pre, .swagger-ui code {{
      font-family: 'JetBrains Mono', monospace !important;
      background: #060910 !important;
      color: #E2E8F0 !important;
      border: 1px solid var(--border-color) !important;
      border-radius: 8px !important;
    }}

    .swagger-ui .model-box {{
      background: #0B0F19 !important;
      border: 1px solid var(--border-color) !important;
      border-radius: 12px !important;
    }}
  </style>
</head>
<body>
  <nav class="custom-navbar">
    <a href="/" class="custom-brand">
      <span class="logo-icon">🍅</span>
      <span class="title">AgriVision API Docs</span>
    </a>
    <div class="custom-nav-links">
      <div class="badge-status">
        <span class="dot"></span>
        <span>Docker Swarm Active</span>
      </div>
      <a href="/" class="nav-btn">🌾 Live Playground</a>
      <a href="https://huggingface.co/ginganomercy/agrivision-mobilenetv2" target="_blank" class="nav-btn">🤗 HF Model</a>
    </div>
  </nav>

  <div id="swagger-ui"></div>

  <script src="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui-standalone-preset.js"></script>
  <script>
    window.onload = function() {{
      window.ui = SwaggerUIBundle({{
        url: "{openapi_url}",
        dom_id: '#swagger-ui',
        deepLinking: true,
        presets: [
          SwaggerUIBundle.presets.apis,
          SwaggerUIStandalonePreset
        ],
        plugins: [
          SwaggerUIBundle.plugins.DownloadUrl
        ],
        layout: "StandaloneLayout",
        defaultModelsExpandDepth: -1,
        docExpansion: "list"
      }});
    }};
  </script>
</body>
</html>"""


def render_portal_html() -> str:
    """Menghasilkan Developer Portal & Live Leaf Disease Playground interaktif yang elegan."""
    return """<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AgriVision — Tomato Disease AI Platform</title>
  <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🍅</text></svg>">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&family=Outfit:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg-dark: #070A12;
      --bg-card: rgba(15, 23, 42, 0.7);
      --border-card: rgba(255, 255, 255, 0.08);
      --accent-tomato: #F43F5E;
      --accent-emerald: #10B981;
      --accent-amber: #F59E0B;
      --accent-sky: #38BDF8;
      --text-title: #FFFFFF;
      --text-sub: #94A3B8;
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      font-family: 'Outfit', sans-serif;
    }

    body {
      background-color: var(--bg-dark);
      background-image: 
        radial-gradient(circle at 10% 20%, rgba(244, 63, 94, 0.15) 0%, transparent 40%),
        radial-gradient(circle at 90% 10%, rgba(16, 185, 129, 0.12) 0%, transparent 40%),
        radial-gradient(circle at 50% 80%, rgba(56, 189, 248, 0.08) 0%, transparent 50%);
      color: #E2E8F0;
      min-height: 100vh;
      overflow-x: hidden;
    }

    /* Navbar */
    .navbar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 18px 40px;
      background: rgba(7, 10, 18, 0.85);
      backdrop-filter: blur(20px);
      border-bottom: 1px solid var(--border-card);
      position: sticky;
      top: 0;
      z-index: 100;
    }

    .brand {
      display: flex;
      align-items: center;
      gap: 12px;
      text-decoration: none;
    }

    .brand-icon {
      font-size: 30px;
      filter: drop-shadow(0 0 14px rgba(244, 63, 94, 0.6));
    }

    .brand-title {
      font-size: 22px;
      font-weight: 800;
      background: linear-gradient(135deg, #FFFFFF 20%, #F43F5E 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      letter-spacing: -0.5px;
    }

    .nav-actions {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .status-pill {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background: rgba(16, 185, 129, 0.12);
      border: 1px solid rgba(16, 185, 129, 0.3);
      color: #34D399;
      font-size: 13px;
      font-weight: 600;
      padding: 6px 14px;
      border-radius: 9999px;
    }

    .status-pill .indicator {
      width: 8px;
      height: 8px;
      background-color: #10B981;
      border-radius: 50%;
      box-shadow: 0 0 10px #10B981;
      animation: pulse 2s infinite;
    }

    @keyframes pulse {
      0%, 100% { transform: scale(1); opacity: 1; }
      50% { transform: scale(1.3); opacity: 0.5; }
    }

    .btn-docs {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 8px 18px;
      background: linear-gradient(135deg, rgba(244, 63, 94, 0.2), rgba(244, 63, 94, 0.1));
      border: 1px solid rgba(244, 63, 94, 0.4);
      color: #FFF;
      border-radius: 10px;
      font-size: 14px;
      font-weight: 600;
      text-decoration: none;
      transition: all 0.2s ease;
    }

    .btn-docs:hover {
      background: var(--accent-tomato);
      box-shadow: 0 4px 16px rgba(244, 63, 94, 0.4);
      transform: translateY(-2px);
    }

    /* Container */
    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 48px 24px;
    }

    /* Hero Section */
    .hero {
      text-align: center;
      margin-bottom: 56px;
    }

    .hero-badge {
      display: inline-block;
      padding: 6px 16px;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid var(--border-card);
      border-radius: 9999px;
      font-size: 13px;
      font-weight: 600;
      color: var(--accent-sky);
      margin-bottom: 20px;
      letter-spacing: 0.5px;
      text-transform: uppercase;
    }

    .hero-title {
      font-size: 48px;
      font-weight: 800;
      letter-spacing: -1.5px;
      line-height: 1.15;
      margin-bottom: 18px;
      background: linear-gradient(135deg, #FFFFFF 40%, #94A3B8 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .hero-title span {
      background: linear-gradient(135deg, #F43F5E 0%, #FB7185 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .hero-desc {
      font-size: 18px;
      color: var(--text-sub);
      max-width: 680px;
      margin: 0 auto 32px auto;
      line-height: 1.6;
    }

    /* Architecture Metric Ribbon */
    .metric-ribbon {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 16px;
      margin-bottom: 48px;
    }

    .metric-card {
      background: var(--bg-card);
      border: 1px solid var(--border-card);
      border-radius: 14px;
      padding: 20px;
      backdrop-filter: blur(12px);
      text-align: left;
    }

    .metric-card .label {
      font-size: 12px;
      color: var(--text-sub);
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 6px;
    }

    .metric-card .value {
      font-size: 18px;
      font-weight: 700;
      color: #FFF;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    /* Playground Grid */
    .playground-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 28px;
      margin-bottom: 56px;
    }

    @media (max-width: 900px) {
      .playground-grid {
        grid-template-columns: 1fr;
      }
    }

    .card {
      background: var(--bg-card);
      border: 1px solid var(--border-card);
      border-radius: 20px;
      padding: 32px;
      backdrop-filter: blur(16px);
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
    }

    .card-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 24px;
    }

    .card-title {
      font-size: 20px;
      font-weight: 700;
      color: #FFF;
      display: flex;
      align-items: center;
      gap: 10px;
    }

    /* Upload Area */
    .dropzone {
      border: 2px dashed rgba(255, 255, 255, 0.15);
      border-radius: 16px;
      padding: 40px 20px;
      text-align: center;
      cursor: pointer;
      transition: all 0.2s ease;
      background: rgba(0, 0, 0, 0.2);
      margin-bottom: 20px;
    }

    .dropzone:hover, .dropzone.dragover {
      border-color: var(--accent-tomato);
      background: rgba(244, 63, 94, 0.05);
    }

    .dropzone-icon {
      font-size: 48px;
      margin-bottom: 12px;
    }

    .dropzone-text {
      font-size: 16px;
      font-weight: 600;
      color: #FFF;
      margin-bottom: 4px;
    }

    .dropzone-hint {
      font-size: 13px;
      color: var(--text-sub);
    }

    .preview-box {
      display: none;
      width: 100%;
      height: 220px;
      border-radius: 12px;
      overflow: hidden;
      margin-bottom: 20px;
      border: 1px solid var(--border-card);
      position: relative;
    }

    .preview-box img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .btn-submit {
      width: 100%;
      padding: 14px;
      background: linear-gradient(135deg, #F43F5E, #E11D48);
      color: #FFF;
      border: none;
      border-radius: 12px;
      font-size: 16px;
      font-weight: 700;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      box-shadow: 0 4px 18px rgba(244, 63, 94, 0.4);
      transition: all 0.2s ease;
    }

    .btn-submit:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 6px 24px rgba(244, 63, 94, 0.6);
    }

    .btn-submit:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    /* Preset Leaf Samples */
    .sample-presets {
      margin-top: 20px;
    }

    .sample-label {
      font-size: 12px;
      font-weight: 600;
      color: var(--text-sub);
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 10px;
    }

    .preset-btns {
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
    }

    .preset-btn {
      padding: 6px 12px;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid var(--border-card);
      color: #E2E8F0;
      border-radius: 8px;
      font-size: 13px;
      cursor: pointer;
      transition: all 0.2s;
    }

    .preset-btn:hover {
      background: rgba(255, 255, 255, 0.1);
      border-color: rgba(255, 255, 255, 0.25);
    }

    /* Diagnosis Result Card */
    .result-empty {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 320px;
      color: var(--text-sub);
      text-align: center;
    }

    .result-empty .icon {
      font-size: 48px;
      margin-bottom: 12px;
      opacity: 0.4;
    }

    .result-content {
      display: none;
    }

    .diagnosis-badge {
      display: inline-block;
      padding: 8px 16px;
      border-radius: 10px;
      font-size: 15px;
      font-weight: 700;
      margin-bottom: 16px;
    }

    .badge-bacterial {
      background: rgba(244, 63, 94, 0.15);
      border: 1px solid rgba(244, 63, 94, 0.4);
      color: #FB7185;
    }

    .badge-blight {
      background: rgba(245, 158, 11, 0.15);
      border: 1px solid rgba(245, 158, 11, 0.4);
      color: #FBBF24;
    }

    .badge-healthy {
      background: rgba(16, 185, 129, 0.15);
      border: 1px solid rgba(16, 185, 129, 0.4);
      color: #34D399;
    }

    .meta-row {
      display: flex;
      gap: 16px;
      font-size: 13px;
      font-family: 'JetBrains Mono', monospace;
      color: var(--text-sub);
      margin-bottom: 20px;
      padding-bottom: 16px;
      border-bottom: 1px solid var(--border-card);
    }

    .desc-box {
      margin-bottom: 20px;
    }

    .desc-box h4 {
      font-size: 14px;
      color: #94A3B8;
      margin-bottom: 6px;
      text-transform: uppercase;
      font-weight: 600;
      letter-spacing: 0.5px;
    }

    .desc-box p {
      font-size: 15px;
      line-height: 1.6;
      color: #F8FAFC;
    }

    .recommend-box {
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid var(--border-card);
      border-left: 4px solid var(--accent-sky);
      border-radius: 12px;
      padding: 16px;
      margin-bottom: 20px;
    }

    .recommend-box h4 {
      font-size: 13px;
      color: var(--accent-sky);
      margin-bottom: 6px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .recommend-box p {
      font-size: 14px;
      line-height: 1.6;
      color: #E2E8F0;
    }

    .json-viewer {
      background: #05080E;
      border: 1px solid var(--border-card);
      border-radius: 10px;
      padding: 14px;
      font-family: 'JetBrains Mono', monospace;
      font-size: 12px;
      color: #38BDF8;
      max-height: 150px;
      overflow-y: auto;
      white-space: pre-wrap;
    }

    /* API Documentation Snippet Tabs */
    .docs-section {
      background: var(--bg-card);
      border: 1px solid var(--border-card);
      border-radius: 20px;
      padding: 36px;
      backdrop-filter: blur(16px);
      margin-bottom: 40px;
    }

    .docs-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
    }

    .tab-nav {
      display: flex;
      gap: 8px;
    }

    .tab-btn {
      padding: 8px 16px;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid var(--border-card);
      border-radius: 8px;
      color: var(--text-sub);
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
    }

    .tab-btn.active {
      background: rgba(244, 63, 94, 0.15);
      border-color: rgba(244, 63, 94, 0.4);
      color: #FFF;
    }

    .code-container {
      background: #05080E;
      border: 1px solid var(--border-card);
      border-radius: 12px;
      padding: 20px;
      position: relative;
    }

    .code-block {
      font-family: 'JetBrains Mono', monospace;
      font-size: 13px;
      color: #E2E8F0;
      line-height: 1.6;
      overflow-x: auto;
      white-space: pre;
    }

    .copy-btn {
      position: absolute;
      top: 14px;
      right: 14px;
      padding: 6px 12px;
      background: rgba(255, 255, 255, 0.08);
      border: 1px solid var(--border-card);
      color: #CBD5E1;
      border-radius: 6px;
      font-size: 12px;
      cursor: pointer;
      font-family: 'Outfit', sans-serif;
      transition: all 0.2s;
    }

    .copy-btn:hover {
      background: rgba(255, 255, 255, 0.15);
      color: #FFF;
    }

    /* Footer */
    footer {
      text-align: center;
      padding: 32px;
      border-top: 1px solid var(--border-card);
      color: var(--text-sub);
      font-size: 14px;
    }
  </style>
</head>
<body>
  <!-- Top Navigation -->
  <nav class="navbar">
    <a href="/" class="brand">
      <span class="brand-icon">🍅</span>
      <span class="brand-title">AgriVision AI</span>
    </a>
    <div class="nav-actions">
      <div class="status-pill">
        <span class="indicator"></span>
        <span>Online (Docker Swarm)</span>
      </div>
      <a href="/docs" class="btn-docs">
        <span>Swagger Docs</span>
        <span>→</span>
      </a>
    </div>
  </nav>

  <div class="container">
    <!-- Hero Section -->
    <section class="hero">
      <div class="hero-badge">Deep Learning Model Serving v1.0.0</div>
      <h1 class="hero-title">Tomato Leaf Disease<br><span>Diagnosis & Treatment API</span></h1>
      <p class="hero-desc">
        Deteksi penyakit daun tomat secara real-time menggunakan arsitektur MobileNetV2 PyTorch CPU, terdistribusi dengan Docker Swarm, di-route via Cloudflare Zero Trust Ingress.
      </p>
    </section>

    <!-- Metrics Ribbon -->
    <div class="metric-ribbon">
      <div class="metric-card">
        <div class="label">Core Architecture</div>
        <div class="value">MobileNetV2 (CPU)</div>
      </div>
      <div class="metric-card">
        <div class="label">Classification Scope</div>
        <div class="value">3 Target Classes</div>
      </div>
      <div class="metric-card">
        <div class="label">Request Tracing</div>
        <div class="value">Twitter Snowflake</div>
      </div>
      <div class="metric-card">
        <div class="label">Ingress Routing</div>
        <div class="value">Cloudflare Tunnel</div>
      </div>
    </div>

    <!-- Playground Grid -->
    <div class="playground-grid">
      <!-- Input Card -->
      <div class="card">
        <div class="card-header">
          <div class="card-title">
            <span>📷</span>
            <span>Uji Coba Inferensi Daun</span>
          </div>
        </div>

        <div class="dropzone" id="dropzone">
          <div class="dropzone-icon">🍃</div>
          <div class="dropzone-text">Pilih atau Drag & Drop Foto Daun</div>
          <div class="dropzone-hint">Format yang didukung: JPG, PNG, WEBP (Maksimal 10MB)</div>
          <input type="file" id="fileInput" accept="image/jpeg,image/png,image/webp" style="display: none;">
        </div>

        <div class="preview-box" id="previewBox">
          <img id="previewImg" src="" alt="Pratinjau Daun">
        </div>

        <button class="btn-submit" id="btnSubmit" disabled>
          <span id="btnText">🔍 Analisis Penyakit Daun</span>
        </button>

        <div class="sample-presets">
          <div class="sample-label">Atau Gunakan Sampel Uji Cepat:</div>
          <div class="preset-btns">
            <button class="preset-btn" onclick="loadSamplePreset('healthy')">🍃 Daun Sehat</button>
            <button class="preset-btn" onclick="loadSamplePreset('bacterial')">🍂 Bercak Bakteri</button>
            <button class="preset-btn" onclick="loadSamplePreset('blight')">🥀 Hawar Daun</button>
          </div>
        </div>
      </div>

      <!-- Result Card -->
      <div class="card">
        <div class="card-header">
          <div class="card-title">
            <span>📊</span>
            <span>Hasil Diagnosis AI</span>
          </div>
          <div id="latencyBadge" style="font-size: 13px; color: #94A3B8; font-family: monospace;"></div>
        </div>

        <div class="result-empty" id="resultEmpty">
          <div class="icon">🔬</div>
          <p>Unggah foto daun tomat di sebelah kiri untuk melihat hasil diagnosis, deskripsi patogen, dan saran pengobatan otomatis.</p>
        </div>

        <div class="result-content" id="resultContent">
          <div class="diagnosis-badge" id="diagBadge">Tomato Leaf Diagnosis</div>

          <div class="meta-row">
            <div>Trace ID: <span id="traceId" style="color: #38BDF8;">-</span></div>
            <div>Prediction ID: <span id="predId" style="color: #F43F5E;">-</span></div>
          </div>

          <div class="desc-box">
            <h4>Deskripsi Penyakit</h4>
            <p id="descText">-</p>
          </div>

          <div class="recommend-box">
            <h4>Rekomendasi Penanganan & Pengobatan</h4>
            <p id="recomText">-</p>
          </div>

          <div class="desc-box">
            <h4>Raw Response JSON</h4>
            <div class="json-viewer" id="rawJson">-</div>
          </div>
        </div>
      </div>
    </div>

    <!-- API Reference Tabs Section -->
    <div class="docs-section">
      <div class="docs-header">
        <div>
          <h3 style="font-size: 22px; font-weight: 700; color: #FFF; margin-bottom: 6px;">Integrasi Kode Klien (Client SDK)</h3>
          <p style="font-size: 14px; color: var(--text-sub);">Contoh pemanggilan endpoint POST /v1/predict dari berbagai bahasa pemrograman.</p>
        </div>
        <div class="tab-nav">
          <button class="tab-btn active" onclick="switchTab('curl')">cURL</button>
          <button class="tab-btn" onclick="switchTab('python')">Python</button>
          <button class="tab-btn" onclick="switchTab('js')">JavaScript</button>
        </div>
      </div>

      <div class="code-container">
        <button class="copy-btn" onclick="copyCode()">Copy</button>
        <div class="code-block" id="codeContent">curl -X POST "https://agrivision.pbjt.ac.id/v1/predict" \
  -H "accept: application/json" \
  -H "Content-Type: multipart/form-data" \
  -F "file=@daun_tomat.jpg;type=image/jpeg"</div>
      </div>
    </div>
  </div>

  <footer>
    <p>© 2026 AgriVision AI • Tomato Pathology Edge Computing • Protected by Cloudflare</p>
  </footer>

  <script>
    const dropzone = document.getElementById('dropzone');
    const fileInput = document.getElementById('fileInput');
    const previewBox = document.getElementById('previewBox');
    const previewImg = document.getElementById('previewImg');
    const btnSubmit = document.getElementById('btnSubmit');
    const btnText = document.getElementById('btnText');
    const resultEmpty = document.getElementById('resultEmpty');
    const resultContent = document.getElementById('resultContent');

    let currentFile = null;

    dropzone.addEventListener('click', () => fileInput.click());

    dropzone.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropzone.classList.add('dragover');
    });

    dropzone.addEventListener('dragleave', () => dropzone.classList.remove('dragover'));

    dropzone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropzone.classList.remove('dragover');
      if (e.dataTransfer.files.length > 0) {
        handleFileSelect(e.dataTransfer.files[0]);
      }
    });

    fileInput.addEventListener('change', (e) => {
      if (e.target.files.length > 0) {
        handleFileSelect(e.target.files[0]);
      }
    });

    function handleFileSelect(file) {
      currentFile = file;
      const reader = new FileReader();
      reader.onload = (e) => {
        previewImg.src = e.target.result;
        previewBox.style.display = 'block';
        btnSubmit.disabled = false;
      };
      reader.readAsDataURL(file);
    }

    // Preset generator menggunakan canvas agar bebas network dependency
    function loadSamplePreset(type) {
      const canvas = document.createElement('canvas');
      canvas.width = 224;
      canvas.height = 224;
      const ctx = canvas.getContext('2d');

      if (type === 'healthy') {
        ctx.fillStyle = '#228B22'; // Hijau segar
        ctx.fillRect(0, 0, 224, 224);
      } else if (type === 'bacterial') {
        ctx.fillStyle = '#654321'; // Coklat bercak
        ctx.fillRect(0, 0, 224, 224);
        ctx.fillStyle = '#F59E0B';
        ctx.beginPath();
        ctx.arc(112, 112, 40, 0, 2 * Math.PI);
        ctx.fill();
      } else {
        ctx.fillStyle = '#2F4F4F'; // Gelap kehitaman
        ctx.fillRect(0, 0, 224, 224);
      }

      canvas.toBlob((blob) => {
        const file = new File([blob], `sample_${type}.jpg`, { type: 'image/jpeg' });
        handleFileSelect(file);
      }, 'image/jpeg');
    }

    btnSubmit.addEventListener('click', async () => {
      if (!currentFile) return;

      btnSubmit.disabled = true;
      btnText.textContent = '⏳ Menganalisis Gambar...';
      const startTime = performance.now();

      const formData = new FormData();
      formData.append('file', currentFile);

      try {
        const response = await fetch('/v1/predict', {
          method: 'POST',
          body: formData
        });

        const data = await response.json();
        const endTime = performance.now();
        const latency = Math.round(endTime - startTime);

        if (response.ok && data.success) {
          displayResult(data, latency);
        } else {
          alert('Error: ' + (data.error ? data.error.message : 'Gagal menganalisis'));
        }
      } catch (err) {
        alert('Gagal menghubungi backend: ' + err.message);
      } finally {
        btnSubmit.disabled = false;
        btnText.textContent = '🔍 Analisis Penyakit Daun';
      }
    });

    function displayResult(data, latency) {
      resultEmpty.style.display = 'none';
      resultContent.style.display = 'block';

      document.getElementById('latencyBadge').textContent = `Latency: ${latency}ms`;
      document.getElementById('traceId').textContent = data.trace_id || '-';
      document.getElementById('predId').textContent = data.data.prediction_id || '-';
      document.getElementById('descText').textContent = data.data.description;
      document.getElementById('recomText').textContent = data.data.recommendation;
      document.getElementById('rawJson').textContent = JSON.stringify(data, null, 2);

      const diag = data.data.diagnosis;
      const badge = document.getElementById('diagBadge');
      badge.textContent = diag;

      badge.className = 'diagnosis-badge ';
      if (diag.includes('healthy')) {
        badge.classList.add('badge-healthy');
      } else if (diag.includes('Bacterial')) {
        badge.classList.add('badge-bacterial');
      } else {
        badge.classList.add('badge-blight');
      }
    }

    const snippets = {
      curl: `curl -X POST "https://agrivision.pbjt.ac.id/v1/predict" \\
  -H "accept: application/json" \\
  -H "Content-Type: multipart/form-data" \\
  -F "file=@daun_tomat.jpg;type=image/jpeg"`,
      python: `import requests

url = "https://agrivision.pbjt.ac.id/v1/predict"
files = {"file": ("daun_tomat.jpg", open("daun_tomat.jpg", "rb"), "image/jpeg")}

response = requests.post(url, files=files)
result = response.json()
print("Diagnosis:", result["data"]["diagnosis"])
print("Saran:", result["data"]["recommendation"])`,
      js: `const formData = new FormData();
formData.append('file', fileInput.files[0]);

const response = await fetch('https://agrivision.pbjt.ac.id/v1/predict', {
  method: 'POST',
  body: formData
});

const result = await response.json();
console.log(result.data.diagnosis);`
    };

    function switchTab(lang) {
      document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
      event.target.classList.add('active');
      document.getElementById('codeContent').textContent = snippets[lang];
    }

    function copyCode() {
      const code = document.getElementById('codeContent').textContent;
      navigator.clipboard.writeText(code).then(() => {
        const btn = document.querySelector('.copy-btn');
        btn.textContent = 'Copied!';
        setTimeout(() => btn.textContent = 'Copy', 2000);
      });
    }
  </script>
</body>
</html>"""
