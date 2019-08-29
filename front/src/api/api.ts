// import { stringify } from "query-string";
// import { State } from "../screens/state";

import { authorizedFetch } from '../logic/auth';

export type Resumes = {
    resumes: [{
      last_modified: string,
      metadata: {
        agency: string,
        column1: string,
        column2: string,
        column3: string,
        description: string,
        email: string,
        experience: string,
        firstname: string,
        lang: string,
        name: string,
        theme: string
      },
      path: string,
      uuid: string,
      version: string
    }]
}

export const getResumes = async (): Promise<Resumes> => authorizedFetch(`/resumes`)

