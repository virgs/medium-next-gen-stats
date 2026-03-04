# Medium Next Generation Stats

[![CircleCI](https://dl.circleci.com/status-badge/img/gh/virgs/medium-next-gen-stats/tree/master.svg?style=svg)](https://dl.circleci.com/status-badge/redirect/gh/virgs/medium-next-gen-stats/tree/master)
[![codecov](https://codecov.io/gh/virgs/medium-next-gen-stats/branch/master/graph/badge.svg)](https://codecov.io/gh/virgs/medium-next-gen-stats)

Don't you think medium.com provides way less information that they should?
I got tired of waiting for them to make it better and decided to make it by myself.
Take your medium text stats to the Next Generation and get rid of the old fashion dataless default medium.

A browser extension that provides richer information about your texts.  
[<img src="https://raw.githubusercontent.com/alrra/browser-logos/master/src/firefox/firefox_48x48.png" alt="Firefox" width="24px" height="24px" />](https://addons.mozilla.org/firefox/addon/medium-next-generation-stats) [<img src="https://raw.githubusercontent.com/alrra/browser-logos/master/src/chrome/chrome_48x48.png" alt="Firefox" width="24px" height="24px" />](https://chrome.google.com/webstore/detail/medium-next-generation-st/fhopcbdfcaleefngfpglahlpfhagendo)  


<img src="images/tutorial.gif" alt="tutorial" width="100%">  

Get larger time range, daily/weekly/monthly read/views/claps, and, specially, describes which article was view in which period.

Have fun!

![snapshot2](images/snapshot2.png)

### Features
-  Highlight post/publication
-  Larger time ranges: 30/90/180/360/1800 days.
-  Super cool and animated charts
-  Total stories views/reads/claps/earnings
-  Top articles/publications read/viewed/clapped/earned in the time range
-  Different ranges visualization: daily, weekly and monthly
-  Download JSON data file

![snapshot3](images/snapshot3.png)

### How to use
1. Go to your medium stats page: https://medium.com/me/stats
2. This is it

### Contact
Official website: https://virgs.me/mngs  
Medium: https://medium.com/@virgs  
Github: https://github.com/virgs  
Pagehub: https://pagehub.me/virgs  

### Source Code
You can find the source code on the link below: 
https://github.com/virgs/medium-next-gen-stats

![snapshot1](images/snapshot1.png)

### Tech Stack
- **TypeScript** + **React** + **Bootstrap** (react-bootstrap)
- **Chart.js** (via react-chartjs-2) for interactive charts
- **FontAwesome** (via @fortawesome/react-fontawesome) for icons
- **Vite** + **@crxjs/vite-plugin** for building the Chrome extension
- **Vitest** + **React Testing Library** for unit testing
- **pnpm** as the package manager

### Development

#### Prerequisites
- Node.js (v18+)
- pnpm (`npm install -g pnpm`)

#### Setup
```bash
git clone https://github.com/virgs/medium-next-gen-stats.git
cd medium-next-gen-stats
pnpm install
```

#### Scripts
| Command              | Description                        |
|----------------------|------------------------------------|
| `pnpm dev`           | Start Vite dev server              |
| `pnpm build`         | Build the extension for production |
| `pnpm test`          | Run tests once                     |
| `pnpm test:watch`    | Run tests in watch mode            |
| `pnpm test:coverage` | Run tests with coverage report     |

#### Load in Browser

- ##### Chrome
    1. Run `pnpm build`
    2. Go to `chrome://extensions`
    3. Enable developer mode
    4. Click on `Load unpacked` and select the `dist` folder

- ##### Firefox
    1. Run `pnpm build`
    2. Go to `about:debugging` → `This Firefox`
    3. Click on `Load Temporary Add-on`
    4. Select the `dist/manifest.json` file

PRs are most welcome :)

### Acknowledgement
Thanks to [tomastrajan](https://github.com/tomastrajan/medium-enhanced-stats) and [HcwXd](https://github.com/HcwXd/better-medium-stats) for sharing their ideas and source code.   
You made my life a lot easier.
