import axios from 'axios';
import dotenv from 'dotenv'
dotenv.config()

const HEADERS = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'CLIENT-ID': process.env.VERYFI_CLIENT_ID,
    'AUTHORIZATION': process.env.VERYFI_AUTH,
};

export async function scanReceipt(imageUrl) {
    const config = {
        method: 'post',
        maxBodyLength: Infinity,
        url: 'https://api.veryfi.com/api/v8/partner/documents',
        headers: HEADERS,
        data: { file_url: imageUrl },
    };

    const response = await axios(config);
    return response.data;
}