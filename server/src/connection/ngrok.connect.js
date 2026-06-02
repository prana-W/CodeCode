import ngrok from '@ngrok/ngrok';

const connectToNgrok = async (port) => {
    try {
        return await ngrok.forward({
            addr: port,
            authtoken: process.env.NGROK_AUTHTOKEN,
            domain: process.env.NGROK_DOMAIN,
        });
    } catch (error) {
        console.error('Error in connecting to ngrok:', error);
    }
};

export default connectToNgrok;

process.stdin.resume();
