import {Octokit} from '@octokit/rest';

import fs from 'fs'
import {components} from '@octokit/openapi-types';

const githubToken = process.argv[2];

const octokit = new Octokit({auth: githubToken});

type Contributor = {
  username?: string;
  commits: number;
}

const dataFile = "data/data.json";

async function readData(): Promise<components["schemas"]["contributor-activity"][]> {
  if (fs.existsSync(dataFile)) {
    return JSON.parse(fs.readFileSync(dataFile, 'utf-8'));
  }

  const response = await octokit.rest.repos.getContributorsStats({
    owner: 'ethereum',
    repo: 'go-ethereum'
  });

  if (response.status === 200) {
    const data = response.data

    fs.writeFileSync(dataFile, JSON.stringify(data, null, 4), 'utf-8');
    return data;
  }

  throw new Error("Can't find data");
}

async function hello() {

  const data = await readData();

  const contributors = data.map<Contributor>(it => ({
      username: it.author?.login,
      commits: it.weeks.map(it => it.c).filter((it): it is number => it !== undefined).reduce((a, b) => a + b)
    })
  )
    .filter(it => it.commits > 0)
    .sort((a, b) => b.commits - a.commits)
  console.log("### contributors", contributors);
}

hello()

