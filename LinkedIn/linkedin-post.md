I built the brain. AI built the face. 🧠🤖

Most "AI projects" I see are a prompt and a screenshot.
This one was different: I treated AI like a fast junior developer, and my job was to be the architect.

The project: a New Zealand vehicle theft analysis in Power BI.
3 raw CSV files → 4,553 stolen vehicles → a 5-page interactive report.

Here's how the work split 👇

🧠 Me: the semantic model
• Designed the star schema: 1 fact table + 4 dimensions
• Defined the measure layer: 28 DAX measures in 6 display folders (time intelligence, rates per 100K, rankings)
• Set the optimisation rules: hidden keys, no implicit measures, auto date/time off

🤖 Claude Code: the report
• Built 5 storytelling pages with tab navigation, KPI cards, a treemap, a heatmap and a scatter chart
• Created a custom theme from scratch
• Validated every page and reviewed screenshots in Power BI Desktop, then fixed what looked wrong

The skill that mattered most wasn't DAX or design.
It was knowing what "good" looks like, and steering until we got there.

When the first version came back, I pushed back: the navigation broke, the titles were vague, the landing page was all one colour. Every round got sharper because I could judge the output instead of just accepting it.

What the data revealed:
📈 Monthly thefts grew 2.3×, from 464 to 1,053 in five months
📍 Auckland has the most thefts, but Gisborne has the highest rate (338 per 100K people)
🚗 Only 4.2% were luxury cars. Toyota, stationwagons and silver cars lead the list

My takeaway: AI doesn't replace a BI developer. It rewards the ones who know the fundamentals well enough to direct it.

How are you using AI in your analytics workflow? I'd love to hear 👇

#PowerBI #DataAnalytics #DAX #DataModeling #ClaudeCode #AI #BusinessIntelligence #DataVisualization
