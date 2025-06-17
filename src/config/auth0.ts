import Auth0 from 'react-native-auth0';

const domain = 'dev-a6aw485tz3gri5op.us.auth0.com';
const clientId = 'IFLprMwJDOHrhegAPjEo5nazgZ4SkuwO'; // Replace with your Auth0 client ID

export const auth0 = new Auth0({
  domain,
  clientId,
});

export const auth0Config = {
  domain,
  clientId,
}; 