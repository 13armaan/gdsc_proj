import asyncio
from playwright.async_api import async_playwright

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(viewport={'width': 1280, 'height': 800})
        page = await context.new_page()
        
        print("Navigating to frontend...")
        await page.goto("http://localhost:5173")
        await page.wait_for_load_state('networkidle')
        
        print("Typing repo path...")
        # find the input field by placeholder
        await page.fill('input[placeholder="Search file..."]', '') # Actually we need the repo path input
        # The repo path input is the one before the scan button. Let's find it.
        # Wait, from earlier view of App.tsx, the header has a form with an input.
        # <input type="text" value={repoPath} onChange={(e) => setRepoPath(e.target.value)} ... placeholder="Enter local repository path..." />
        await page.fill('input[placeholder="Enter local repository path..."]', 'C:/Users/ishan/Desktop/repomap-analyzer')
        
        print("Clicking Scan Repo...")
        await page.click('button:has-text("Scan")')
        
        # Wait for the graph to load (isLoading goes false)
        # We can wait for a node to appear
        print("Waiting for graph to load...")
        await page.wait_for_selector('.react-flow__node', timeout=30000)
        await asyncio.sleep(2) # let ELK settle
        
        print("Taking architecture_map.png")
        await page.screenshot(path="../docs/screenshots/architecture_map.png", full_page=True)
        
        print("Clicking Folder view...")
        await page.click('button:has-text("Folder")')
        await asyncio.sleep(2)
        print("Taking aggregation_views.png")
        await page.screenshot(path="../docs/screenshots/aggregation_views.png", full_page=True)
        
        print("Clicking File view back...")
        await page.click('button:has-text("File")')
        await asyncio.sleep(2)
        
        print("Opening Insights...")
        await page.click('button:has-text("Insights")')
        await asyncio.sleep(1)
        print("Taking dependency_detection.png")
        await page.screenshot(path="../docs/screenshots/dependency_detection.png", full_page=True)
        
        print("Opening Dashboard...")
        # close insights first? Actually clicking Dashboard might switch it
        await page.click('button:has-text("Dashboard")')
        await asyncio.sleep(2) # recharts animation
        print("Taking analytics_dashboard.png")
        await page.screenshot(path="../docs/screenshots/analytics_dashboard.png", full_page=True)
        
        # Close dashboard to see graph again
        await page.keyboard.press('Escape')
        await asyncio.sleep(1)
        
        print("Clicking a node for AI summary...")
        # Click the first file node
        await page.click('.react-flow__node-file:first-of-type')
        await asyncio.sleep(5) # wait for AI to stream
        print("Taking semantic_summarization.png")
        await page.screenshot(path="../docs/screenshots/semantic_summarization.png", full_page=True)
        
        await browser.close()
        print("Done!")

asyncio.run(main())
