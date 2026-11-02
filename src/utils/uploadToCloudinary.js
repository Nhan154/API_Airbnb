import cloudinary from "../config/cloudinary.js";

export const createUploadToCloudinary = (cloudinaryClient) => (fileBuffer, folder) => {
    return new Promise((resolve, reject) => {
        const stream = cloudinaryClient.uploader.upload_stream(
            {
                folder: `airbnb/${folder}`,
                resource_type: "image",
            },
            (error, result) => {
                if (error) {
                    return reject(error);
                }

                if (!result?.secure_url || !result?.public_id) {
                    return reject(new Error("Cloudinary returned an invalid upload result"));
                }

                resolve({
                    url: result.secure_url,
                    publicId: result.public_id,
                });
            }
        );

        stream.end(fileBuffer);
    });
};

const uploadToCloudinary = createUploadToCloudinary(cloudinary);

export default uploadToCloudinary;
