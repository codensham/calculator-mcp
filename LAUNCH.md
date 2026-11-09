# Launch checklist

Things only you can do, because they need your accounts or your Claude setup.

- [ ] Put your name in `LICENSE`.
- [ ] Create the GitHub repo and push: `git remote add origin <url>`, then `git push -u origin main`.
- [ ] Check that the npm name is free: `npm view calculator-mcp`. If it's taken, change `name` and `bin` in `package.json` and every `calculator-mcp` in `README.md`.
- [ ] Publish: `npm run build`, `npm login`, `npm publish`.
- [ ] Add it to Claude Desktop and Claude Code (snippets in the README) and call every tool once.
- [ ] Try `divide` in each client you have. Note which ones support sampling (the model answers) and which support elicitation (you get a form), then fill in the "Client support for divide" table in the README.
- [ ] Take screenshots of the best methodology reports and add them to the README.
