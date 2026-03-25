import axios from 'axios';



const CLIENT_ID = '542df271-9e49-4990-a904-f66c72649a50';

const TENANT_ID = 'e34179fe-1f3f-4737-94ab-d546b7013b53';

const SCOPE = 'Files.ReadWrite offline_access';



async function obtenerRefreshToken() {

    try {

        // 1. Solicitar el código de dispositivo

        const deviceCodeUrl = `https://login.microsoftonline.com/${TENANT_ID}/oauth2/v2.0/devicecode`;

        const deviceResponse = await axios.post(deviceCodeUrl, new URLSearchParams({

            client_id: CLIENT_ID,

            scope: SCOPE

        }));



        console.log('\n======================================================');

        console.log('⚠️ ACCIÓN REQUERIDA ⚠️');

        console.log(deviceResponse.data.message);

        console.log('======================================================\n');



        // 2. Esperar a que inicies sesión (Polling)

        const tokenUrl = `https://login.microsoftonline.com/${TENANT_ID}/oauth2/v2.0/token`;

        let isAuthenticated = false;



        console.log('Esperando a que inicies sesión en el navegador...');



        while (!isAuthenticated) {

            await new Promise(resolve => setTimeout(resolve, 5000)); // Esperar 5 segundos



            try {

                const tokenResponse = await axios.post(tokenUrl, new URLSearchParams({

                    grant_type: 'urn:ietf:params:oauth:grant-type:device_code',

                    client_id: CLIENT_ID,

                    device_code: deviceResponse.data.device_code

                }));



                console.log('\n✅ ¡Autenticación Exitosa!\n');

                console.log('🔑 TU REFRESH TOKEN ES (Guárdalo muy bien, no lo compartas):');

                console.log('------------------------------------------------------');

                console.log(tokenResponse.data.refresh_token);

                console.log('------------------------------------------------------\n');

                isAuthenticated = true;



            } catch (err) {

                if (err.response && err.response.data.error !== 'authorization_pending') {

                    console.error('Error:', err.response.data.error_description);

                    break;

                }

            }

        }

    } catch (error) {

        console.error('Error al iniciar el flujo:', error.message);

    }

}



obtenerRefreshToken();