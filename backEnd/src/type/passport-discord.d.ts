declare module 'passport-discord' {
  import { Strategy as OAuth2Strategy } from 'passport-oauth2'

  export interface Profile {
    id:            string
    username:      string
    discriminator: string
    email?:        string
    avatar?:       string
    photos?:       { value: string }[]
  }

  export class Strategy extends OAuth2Strategy {
    constructor(
      options: {
        clientID:     string
        clientSecret: string
        callbackURL:  string
        scope:        string[]
      },
      verify: (
        accessToken:  string,
        refreshToken: string,
        profile:      Profile,
        done:         (err: any, user?: any) => void
      ) => void
    )
  }
}