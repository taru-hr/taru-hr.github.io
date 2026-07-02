<#
.SYNOPSIS
    Convert a PowerPoint (.pptx) into a self-contained Reveal.js web deck,
    styled to match the Taru HR dark-and-gold website.

.DESCRIPTION
    A .pptx file is really a .zip of XML. This script reads the text of each
    slide (no Office, Python or extra installs required - just Windows
    PowerShell) and writes ONE HTML file you can open in any browser or drop
    into the /posts folder.

    It produces a clean STARTING POINT: each slide becomes a heading plus
    bullet points. Fancy PowerPoint layouts (columns, tables, images, exact
    positions) are not reproduced - you refine those by hand afterwards.
    See tools/README.md for the full workflow.

.PARAMETER PptxPath
    Path to the .pptx file to convert. (Required.)

.PARAMETER OutPath
    Where to write the .html file. Defaults to the same name/location as the
    .pptx but with an .html extension.

.PARAMETER Title
    The browser-tab title and title-slide heading. Defaults to the file name.

.EXAMPLE
    .\tools\Convert-PptxToReveal.ps1 -PptxPath ".\My Deck.pptx"

.EXAMPLE
    .\tools\Convert-PptxToReveal.ps1 -PptxPath ".\HR_Operations_Hub Taru HR.pptx" -OutPath ".\posts\my-deck.html" -Title "HR Operations Hub"

.NOTES
    If PowerShell blocks the script, run it once as:
      powershell -ExecutionPolicy Bypass -File .\tools\Convert-PptxToReveal.ps1 -PptxPath ".\My Deck.pptx"
#>

[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)]
    [string] $PptxPath,

    [string] $OutPath,

    [string] $Title
)

$ErrorActionPreference = 'Stop'

# --- resolve paths ---------------------------------------------------------
if (-not (Test-Path -LiteralPath $PptxPath)) {
    throw "File not found: $PptxPath"
}
$pptxItem = Get-Item -LiteralPath $PptxPath
if (-not $OutPath) {
    $OutPath = [System.IO.Path]::ChangeExtension($pptxItem.FullName, '.html')
}
if (-not $Title) {
    $Title = [System.IO.Path]::GetFileNameWithoutExtension($pptxItem.Name)
}

# --- small helpers ---------------------------------------------------------

# Turn XML-escaped run text into plain text, then re-escape it safely for HTML.
function ConvertTo-HtmlText {
    param([string] $Raw)
    if ($null -eq $Raw) { return '' }
    # decode the handful of XML entities PowerPoint uses...
    $t = $Raw -replace '&lt;', '<' -replace '&gt;', '>' -replace '&quot;', '"' `
              -replace '&apos;', "'" -replace '&amp;', '&'
    # ...then escape for HTML output (order matters: ampersand first)
    $t = $t -replace '&', '&amp;' -replace '<', '&lt;' -replace '>', '&gt;'
    return $t.Trim()
}

# --- read the slides out of the .pptx (a zip of XML) -----------------------
Add-Type -AssemblyName System.IO.Compression.FileSystem | Out-Null
$zip = [System.IO.Compression.ZipFile]::OpenRead($pptxItem.FullName)
try {
    $slideEntries =
        $zip.Entries |
        Where-Object { $_.FullName -match '^ppt/slides/slide[0-9]+\.xml$' } |
        Sort-Object { [int]([regex]::Match($_.Name, '\d+').Value) }

    if (-not $slideEntries) { throw "No slides found inside $($pptxItem.Name)." }

    $sections = New-Object System.Collections.Generic.List[string]
    $slideNo = 0

    foreach ($entry in $slideEntries) {
        $slideNo++
        $reader = New-Object System.IO.StreamReader($entry.Open())
        try { $xml = $reader.ReadToEnd() } finally { $reader.Dispose() }

        # Each <a:p> is a paragraph; join its <a:t> runs into one line.
        $paragraphs = New-Object System.Collections.Generic.List[string]
        foreach ($p in [regex]::Matches($xml, '(?s)<a:p\b.*?</a:p>')) {
            $runs = [regex]::Matches($p.Value, '(?s)<a:t>(.*?)</a:t>')
            if ($runs.Count -eq 0) { continue }
            $line = (($runs | ForEach-Object { $_.Groups[1].Value }) -join '')
            $line = ConvertTo-HtmlText $line
            if ($line) { $paragraphs.Add($line) }
        }

        # First line = heading, the rest = bullets.
        if ($paragraphs.Count -eq 0) {
            $heading = "Slide $slideNo"
            $bullets = @()
        } else {
            $heading = $paragraphs[0]
            $bullets = $paragraphs | Select-Object -Skip 1
        }

        $kicker = ('Slide {0:00}' -f $slideNo)
        $sb = New-Object System.Text.StringBuilder
        [void]$sb.AppendLine('      <section>')
        [void]$sb.AppendLine("        <p class=""kicker"">$kicker</p>")
        [void]$sb.AppendLine("        <h2 class=""title-bar"">$heading</h2>")
        if ($bullets) {
            [void]$sb.AppendLine('        <ul class="clean">')
            foreach ($b in $bullets) { [void]$sb.AppendLine("          <li>$b</li>") }
            [void]$sb.AppendLine('        </ul>')
        }
        [void]$sb.AppendLine('      </section>')
        $sections.Add($sb.ToString())
    }
}
finally {
    $zip.Dispose()
}

$titleHtml = ConvertTo-HtmlText $Title
$slidesHtml = ($sections -join "`n")

# --- assemble the self-contained HTML file ---------------------------------
$html = @"
<!DOCTYPE html>
<html lang="en">
<!-- Generated by tools/Convert-PptxToReveal.ps1 from a PowerPoint file.
     This is a starting point - refine the slides by hand for the best result. -->
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>$titleHtml</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/reveal.js@5.2.1/dist/reveal.css">
  <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap" rel="stylesheet">
  <style>
    :root {
      --card: hsl(240, 2%, 13%); --border: hsl(0, 0%, 22%);
      --text: hsl(45 100% 68%); --gold: hsl(45, 100%, 68%); --gold-soft: hsl(38, 74%, 61%);
    }
    .reveal { font-family: 'Poppins', sans-serif; font-size: 30px; font-weight: 300; color: var(--text); }
    .reveal .slides { text-align: left; }
    .reveal h1, .reveal h2 { font-family: 'Poppins', sans-serif; color: var(--gold); font-weight: 600;
      text-transform: none; line-height: 1.15; margin: 0 0 0.5em; }
    .reveal h1 { font-size: 2.0em; }
    .reveal h2 { font-size: 1.35em; }
    .reveal h2.title-bar { display: inline-block; padding-bottom: 8px; border-bottom: 3px solid var(--gold); }
    .reveal .kicker { color: var(--gold); font-size: 0.55em; font-weight: 500; letter-spacing: 3px;
      text-transform: uppercase; margin-bottom: 0.5em; }
    .reveal ul.clean { list-style: none; margin-left: 0; }
    .reveal ul.clean li { padding-left: 1.6em; position: relative; margin: 0.4em 0; }
    .reveal ul.clean li::before { content: "\203A"; position: absolute; left: 0.2em; top: -0.02em;
      color: var(--gold); font-weight: 700; }
  </style>
</head>
<body>
  <div class="reveal">
    <div class="slides">
      <!-- Title slide -->
      <section data-background-color="#0d0d0d">
        <h1>$titleHtml</h1>
        <p style="color:var(--text); font-weight:300;">Press &rarr; or Space to begin &middot; F for full screen</p>
      </section>

$slidesHtml
    </div>
  </div>

  <script src="https://cdn.jsdelivr.net/npm/reveal.js@5.2.1/dist/reveal.js"></script>
  <script>
    Reveal.initialize({ width: 1280, height: 720, margin: 0.045, hash: true, slideNumber: 'c/t', transition: 'slide' });
  </script>
</body>
</html>
"@

# --- write it out ----------------------------------------------------------
$outDir = [System.IO.Path]::GetDirectoryName($OutPath)
if ($outDir -and -not (Test-Path -LiteralPath $outDir)) {
    New-Item -ItemType Directory -Path $outDir -Force | Out-Null
}
Set-Content -LiteralPath $OutPath -Value $html -Encoding UTF8

Write-Host ""
Write-Host "  Converted $($slideEntries.Count) slides" -ForegroundColor Green
Write-Host "  From : $($pptxItem.FullName)"
Write-Host "  To   : $OutPath"
Write-Host ""
Write-Host "  Open it in a browser, then refine the slides by hand as needed." -ForegroundColor Yellow
