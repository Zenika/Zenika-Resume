import { Resumes } from '../Types/Resumes'
import { authorizedFetch } from '../logic/auth';

export const getResumes = async (): Promise<Resumes> => authorizedFetch(`/resumes`)

export const getMyResumes = async(): Promise<Resumes> => authorizedFetch(`/resumes/mine`)

