// import { stringify } from "query-string";
// import { State } from "../screens/state";

import { authorizedFetch } from '../logic/auth';

export type Resumes = {
    resumes: [{
      last_modified: String,
      metadata: {
        agency: String,
        column1: String,
        column2: String,
        column3: String,
        description: String,
        email: String,
        experience: String,
        firstname: String,
        lang: String,
        name: String,
        theme: String
      },
      path: String,
      uuid: String,
      version: String
    }]
}

export const getResumes = async (): Promise<Resumes> => {
    const response = await authorizedFetch(`/resumes`)

    console.log(response)

    if (response.ok) {
      return response.json();
    }
    throw response;
  };

