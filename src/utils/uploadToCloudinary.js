import cloudinary from "../config/cloudinary.js";

const uploadToCloudinary = (fileBuffer, folder) => {
    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            {
                folder: `airbnb/${folder}`,
                resource_type: "image",
            },
            (error, result) => {
                if (error) {
                    return reject(error);
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

export default uploadToCloudinary;
