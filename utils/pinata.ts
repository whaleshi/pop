// import { toast } from "sonner";
const MAX_FILE_SIZE_BYTES = 5.0 * 1024 * 1024; // 2 MB in bytes

// 上传图片或者json数据方法
const pinFileToIPFS = async (file: any, type = "image") => {
    const ipfsDomain = process.env.NEXT_PUBLIC_IPFS_DOMAIN;
    const IPFS_DOMAIN = ipfsDomain || "https://ipfs.io";
    const IPFS_KEY = process.env.NEXT_PUBLIC_JWT_KEY;
    if (file.size > MAX_FILE_SIZE_BYTES) {
        // toast.warning("File too large (max 5MB). Please upload a smaller file");
        throw new Error("IPFS upload failed");
    }

    const formData = new FormData();
    formData.append("file", file);

    if (type === "image") {
        // Upload image
        const pinataMetadata = JSON.stringify({
            name: "Image file",
        });
        formData.append("pinataMetadata", pinataMetadata);
    } else if (type === "json") {
        // Upload JSON data
        const jsonBlob = new Blob([JSON.stringify(file)], { type: "application/json" });
        formData.append("file", jsonBlob, "data.json");
        const pinataMetadata = JSON.stringify({
            name: "JSON data",
        });
        formData.append("pinataMetadata", pinataMetadata);
    }

    const pinataOptions = JSON.stringify({
        cidVersion: 0,
    });
    formData.append("pinataOptions", pinataOptions);

    try {
        const res = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
            method: "POST",
            body: formData,
            headers: {
                Authorization: `Bearer ${IPFS_KEY}`,
            },
        });
        const data = await res.json();
        if (!data?.IpfsHash) {
            throw new Error("IPFS upload failed");
        }
        return IPFS_DOMAIN + data.IpfsHash;
    } catch (error) {
        throw new Error("IPFS upload failed");
    }
};

export default pinFileToIPFS;
