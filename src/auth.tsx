import axios from "axios";
import { POST_TYPES, AuthPostResponse } from "./types";
import g from "./g";
import { generateBareUrl, generateAuthBody } from "./utils";

export const initAuth = async (): Promise<boolean> => {
    g.session = Math.floor(100000000 + Math.random() * 900000000);

    try {
        const res = await axios.post(generateBareUrl("REACT", g.integrationID), {
            version: g.ebconfig.version,
            tt: g.ebconfig.tt,
            session: g.session
        }, { headers: { 'Eb-Post-Req': POST_TYPES.HANDSHAKE } });

        if (res.data.token) {
            g.token = res.data.token;
            return true;
        } else {
            return false;
        }
    } catch (error) {
        console.log(error);
        return false;
    }
}

export const tokenPost = async (postType: POST_TYPES, body?: {}): Promise<AuthPostResponse> => {
    try {
        const res = await axios.post(generateBareUrl("REACT", g.integrationID), {
            _auth: generateAuthBody(),
            ...body
        }, { headers: { 'Eb-Post-Req': postType } });

        if ({}.hasOwnProperty.call(res.data, 'ErrorCode') || {}.hasOwnProperty.call(res.data, 'code')) {
            if (res.data.code === "JWT EXPIRED") {
                await initAuth();
                return tokenPost(postType, body);
            }

            return {
                success: false,
                data: res.data.body
            }
        } else {
            return {
                success: res.data.success,
                data: res.data.body
            }
        }
    } catch (error) {
        return {
            success: false,
            data: error
        }
    }
}

export const tokenPostAttachment = async (formData: FormData, customHeaders: {}): Promise<AuthPostResponse> => {
    const regularAuthbody = generateAuthBody();

    const attachmentAuth = {
        'Eb-token': regularAuthbody.token,
        'Eb-token-time': regularAuthbody.token_time,
        'Eb-now': regularAuthbody.now
    };

    try {
        const res = await axios.post(generateBareUrl("REACT", g.integrationID), formData, {
            headers: {
                'Eb-Post-Req': POST_TYPES.UPLOAD_ATTACHMENT,
                'Content-Type': 'multipart/form-data',
                ...customHeaders,
                ...attachmentAuth
            }
        });

        if ({}.hasOwnProperty.call(res.data, 'ErrorCode') || {}.hasOwnProperty.call(res.data, 'code')) {
            if (res.data.code === "JWT EXPIRED") {
                await initAuth();
                return tokenPostAttachment(formData, customHeaders);
            }

            return {
                success: false,
                data: res.data.body
            }
        } else {
            return {
                success: res.data.success,
                data: res.data.body
            }
        }
    } catch (error) {
        return {
            success: false,
            data: error
        }
    }
}
