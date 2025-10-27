import React, { useEffect, useState } from "react";
import { Form, Input, Button, Textarea } from "@heroui/react";
import { useRouter } from "next/router";
import MyAvatar from "@/components/avatarImage"
import pinFileToIPFS from "@/utils/pinata";
import { toast } from "sonner";
import { useAccount } from 'wagmi';
import { writeContract, getBalance, estimateGas, getGasPrice, readContract } from "@wagmi/core";
import { config } from "@/config/wagmi";
import { ethers } from "ethers";
import FactoryABI from "@/constant/TokenFactory.abi.json";
import { CONTRACT_CONFIG, DEFAULT_CHAIN_ID } from "@/config/chains";
import { randomBytes } from "crypto";
import { useIsMobile } from "@/utils/index";
import CreateSuccess from "./createSuccess";
import { FORM_STYLES, AVATAR_STYLES, ERROR_STYLES } from "@/constants/styles";


const MAX_AVATAR_MB = 5;
const ACCEPTED_TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif"];

/** 与 HeroUI Input 保持一致的错误样式 */
function FieldError({ message }: { message?: string | null }) {
	if (!message) return null;
	return <p className={ERROR_STYLES.fieldError}>{message}</p>;
}

/** 头像字段：用“代理校验输入”确保优先校验头像 */
function AvatarField({
	valueUrl,
	onPick,
	onClear,
	required,
	name = "avatar",
	maxMB = MAX_AVATAR_MB,
	loading = false,
	clearInput,
}: {
	valueUrl: string | null;
	onPick: (file?: File) => void;
	onClear: () => void;
	required?: boolean;
	name?: string;
	maxMB?: number;
	loading?: boolean;
	clearInput?: React.Ref<{ clearFileInput: () => void }>;
}) {
	const inputId = "avatar-upload-input";
	const labelId = "avatar-upload-label";
	const wrapperRef = React.useRef<HTMLDivElement>(null);
	const fileInputRef = React.useRef<HTMLInputElement>(null);
	const [errorText, setErrorText] = React.useState<string | null>(null);

	// 暴露清空 file input 的方法给父组件
	React.useImperativeHandle(clearInput, () => ({
		clearFileInput: () => {
			if (fileInputRef.current) {
				fileInputRef.current.value = '';
			}
		}
	}), []);

	const setError = (msg: string | null) => {
		setErrorText(msg);
		if (msg) wrapperRef.current?.classList.add("border-[#f31260]");
		else wrapperRef.current?.classList.remove("border-[#f31260]");
	};

	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (file) {
			if (!ACCEPTED_TYPES.includes(file.type)) {
				e.target.value = "";
				onPick(undefined);
				return;
			}
			const sizeMB = file.size / (1024 * 1024);
			if (sizeMB > maxMB) {
				e.target.value = "";
				onPick(undefined);
				return;
			}
		}
		setError(null);
		onPick(file);
	};

	return (
		<div className="w-full">
			{/* 代理校验输入：保持在最上方，DOM 参与 required 校验（不要 display:none） */}
			<input
				// 这个输入不提交业务数据，仅用于 required 校验顺序
				tabIndex={-1}
				aria-hidden="true"
				className={AVATAR_STYLES.hiddenInput}
				required={!!required}
				// 有头像则通过，无头像则为空触发 invalid
				value={valueUrl ? "1" : ""}
				onChange={() => { }}
				// 提示与样式同步
				onInvalid={(e) => {
					e.preventDefault();
				}}
			/>

			<div className="flex items-center justify-between pb-[8px]">
				<label
					id={labelId}
					htmlFor={inputId}
					className={[`${FORM_STYLES.label.primary} font-bold`, errorText && AVATAR_STYLES.labelError].join(" ")}
				>
					图标
					{required ? <span className="text-[#f31260] ml-[2px]">*</span> : null}
				</label>
			</div>

			<div className="flex items-center" aria-labelledby={labelId}>
				<div
					ref={wrapperRef}
					className={AVATAR_STYLES.wrapper}
				>
					<MyAvatar
						src={valueUrl || "/images/default.png"}
						alt="avatar"
						className={AVATAR_STYLES.avatar}
						name={!valueUrl ? "Avatar" : undefined}
					/>
					{loading && (
						<div className={AVATAR_STYLES.loadingOverlay}>
							<div className={AVATAR_STYLES.loadingSpinner}></div>
						</div>
					)}
					{/* 真正的文件选择输入：不再 required，让代理来控制校验顺序 */}
					<input
						ref={fileInputRef}
						id={inputId}
						name={name}
						type="file"
						accept={ACCEPTED_TYPES.join(",")}
						className={AVATAR_STYLES.fileInput}
						aria-label='uploadAvatar'
						onChange={handleChange}
						onInput={() => setError(null)}
						disabled={loading}
					/>
				</div>
			</div>

			<FieldError message={errorText} />
		</div>
	);
}

export default function CreateForm() {

	const [isSuccessOpen, setIsSuccessOpen] = useState(false);
	const isMobile = useIsMobile();
	const [ticker, setTicker] = useState("");
	const [nameVal, setNameVal] = useState("");

	// 头像
	const [avatarFile, setAvatarFile] = useState<File | null>(null);
	const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
	const [avatarError, setAvatarError] = useState<string | null>(null);
	const [uploadLoading, setUploadLoading] = useState(false);
	const [ipfsHash, setIpfsHash] = useState<string | null>(null);
	const avatarFieldRef = React.useRef<{ clearFileInput: () => void }>(null);
	const [createLoading, setCreateLoading] = useState(false);
	const [descriptionVal, setDescriptionVal] = useState("");
	const [websiteVal, setWebsiteVal] = useState("");
	const [xVal, setXVal] = useState("");
	const [telegramVal, setTelegramVal] = useState("");
	const [amountVal, setAmountVal] = useState("");
	const [createdTokenAddress, setCreatedTokenAddress] = useState<string | null>(null);
	const factoryAddr = CONTRACT_CONFIG.FACTORY_CONTRACT;




	// Wagmi hooks
	const { address, isConnected } = useAccount();


	useEffect(() => {
		if (!avatarFile) {
			setAvatarUrl(null);
			return;
		}
		const url = URL.createObjectURL(avatarFile);
		setAvatarUrl(url);
		return () => URL.revokeObjectURL(url);
	}, [avatarFile]);

	const onPickAvatar = async (file?: File) => {
		setAvatarError(null);
		if (!file) return;

		if (!ACCEPTED_TYPES.includes(file.type)) {
			return;
		}
		const sizeMB = file.size / (1024 * 1024);
		if (sizeMB > MAX_AVATAR_MB) {
			return;
		}

		// 上传到 IPFS
		try {
			setUploadLoading(true);
			const res = await pinFileToIPFS(file);
			if (res) {
				setIpfsHash(res);
				setAvatarFile(file);
				toast.success("图片上传成功");
			} else {
				toast.error("图片上传失败，请重试");
				avatarFieldRef.current?.clearFileInput();
			}
		} catch (error) {
			console.error("IPFS upload error:", error);
			toast.error("图片上传失败，请重试");
			avatarFieldRef.current?.clearFileInput();
		} finally {
			setUploadLoading(false);
		}
	};

	const onClearAvatar = () => {
		setAvatarFile(null);
		setAvatarUrl(null);
		setAvatarError(null);
		setIpfsHash(null);
	};

	// 重置表单数据
	const resetForm = () => {
		setTicker("");
		setNameVal("");
		setDescriptionVal("");
		setWebsiteVal("");
		setXVal("");
		setTelegramVal("");
		setAmountVal("");
		onClearAvatar();
		setCreatedTokenAddress(null);
	};

	// 满足必填：头像、Name、Ticker、税费指定受益人、百分比 均存在
	const requiredValid = !!avatarUrl && nameVal.trim().length > 0 && ticker.trim().length > 0;
	const readyToSubmit = requiredValid && isConnected;



	// 上传最终的 JSON 元数据到 IPFS
	const uploadFile = async () => {
		try {
			const params = {
				name: nameVal,
				symbol: ticker,
				image: ipfsHash,
				description: descriptionVal,
				website: websiteVal,
				x: xVal,
				telegram: telegramVal
			};
			const res = await pinFileToIPFS(params, "json");
			if (!res) {
				toast.error("元数据上传失败");
				setCreateLoading(false);
				return false;
			}
			return res;
		} catch (error) {
			console.error("Upload file error:", error);
			toast.error("元数据上传失败");
			setCreateLoading(false);
			return false;
		}
	};

	// 创建代币合约调用
	const createToken = async (metadataHash: string) => {
		try {
			if (!address) {
				throw new Error("Wallet not connected");
			}
			const salt = "0x" + randomBytes(32).toString("hex");

			// 检查是否有提前购买金额
			const hasPreBuy = amountVal && parseFloat(amountVal) > 0;
			const preBuyAmount = hasPreBuy ? ethers.parseEther(amountVal) : BigInt(0);

			// 估算 gas
			let gasLimit;
			try {
				const estimatedGas = await estimateGas(config, {
					to: factoryAddr as `0x${string}`,
					data: `0x`, // wagmi 会自动处理函数调用数据
					value: hasPreBuy ? preBuyAmount : undefined,
				});
				gasLimit = (estimatedGas * BigInt(120)) / BigInt(100); // +20% buffer
				console.log("预估 Gas Limit:", gasLimit.toString());
			} catch (e) {
				console.warn("Gas 估算失败:", e);
				gasLimit = undefined;
			}

			// 获取 gas price
			const gasPrice = await getGasPrice(config);
			const newGasPrice = gasPrice
				? gasPrice + (gasPrice * BigInt(5)) / BigInt(100)
				: undefined; // +5%

			console.log("Gas Price:", {
				original: gasPrice?.toString(),
				new: newGasPrice?.toString(),
			});

			let txHash;
			try {
				if (hasPreBuy) {
					// 调用 createTokenAndBuy
					txHash = await writeContract(config, {
						address: factoryAddr as `0x${string}`,
						abi: FactoryABI,
						functionName: 'createTokenAndBuy',
						args: [nameVal, ticker, metadataHash, salt, preBuyAmount],
						value: preBuyAmount,
						gas: gasLimit,
						gasPrice: newGasPrice,
					});
				} else {
					// 调用 createToken
					txHash = await writeContract(config, {
						address: factoryAddr as `0x${string}`,
						abi: FactoryABI,
						functionName: 'createToken',
						args: [nameVal, ticker, metadataHash, salt],
						gas: gasLimit,
						gasPrice: newGasPrice,
					});
				}
			} catch (error: any) {
				// 检查用户拒绝交易
				if (
					error?.code === 4001 ||
					error?.message?.toLowerCase().includes("user rejected") ||
					error?.cause?.message?.toLowerCase().includes("user rejected")
				) {
					return null;
				}
				throw error;
			}

			// 等待交易确认
			// 注意：wagmi的writeContract已经等待交易被挖掘，所以不需要额外的wait

			// 使用 readContract 获取新创建的代币地址
			const tokenAddress = await readContract(config, {
				address: factoryAddr as `0x${string}`,
				abi: FactoryABI,
				functionName: 'predictTokenAddress',
				args: [salt],
			});

			return tokenAddress;
		} catch (error) {
			throw error;
		}
	};

	const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		const form = e.currentTarget;

		// 统一触发一次原生校验（遵循 DOM 顺序，先校验头像代理）
		if (!form.checkValidity()) {
			form.reportValidity();
			return;
		}

		// 检查钱包连接
		if (!isConnected || !address) {
			toast.error("请先连接钱包");
			return;
		}

		// 检查网络连接
		if (!isConnected) {
			toast.error("钱包连接异常，请重新连接");
			return;
		}

		try {
			setCreateLoading(true);

			// 1. 上传最终的 JSON 元数据到 IPFS
			const metadataHash = await uploadFile();
			if (!metadataHash) {
				toast.error("元数据上传失败，请重试");
				return; // uploadFile 内部已经处理了错误
			}

			// 2. 调用合约创建代币
			const tokenAddress = await createToken(metadataHash);
			if (!tokenAddress) {
				return; // createToken 内部已经处理了错误提示
			}

			// 3. 创建成功处理
			setCreatedTokenAddress(tokenAddress as string);
			setIsSuccessOpen(true);
			toast.success('代币创建成功！');

			// 4. 失效相关缓存，确保新代币立即显示
			try {
				await fetch('/api/cache/invalidate', {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json'
					},
					body: JSON.stringify({ type: 'tokens' })
				});
				console.log('Cache invalidated after token creation');
			} catch (error) {
				console.warn('Failed to invalidate cache:', error);
				// 不阻断用户流程，只是日志记录
			}

		} catch (error: any) {
			console.error("Create error:", error);

			// 更详细的错误处理
			if (error?.code === 4001) {
				toast.error("用户取消了交易");
			} else if (error?.message?.includes("insufficient funds")) {
				toast.error("余额不足，请检查您的账户余额");
			} else if (error?.message?.includes("network")) {
				toast.error("网络连接异常，请检查网络后重试");
			} else {
				toast.error("创建失败，请稍后重试");
			}
		} finally {
			setCreateLoading(false);
		}
	};

	return (
		<>
			<Form className="w-full px-[16px] pt-[8px] gap-[24px]" onSubmit={onSubmit}>
				{/* 头像（必填，统一提示样式） */}
				<AvatarField
					valueUrl={avatarUrl}
					onPick={onPickAvatar}
					onClear={onClearAvatar}
					required
					loading={uploadLoading}
					clearInput={avatarFieldRef}
				/>

				{/* 基本信息 */}
				<Input
					classNames={{
						inputWrapper: "h-[48px] border-[#333] bg-[#1A1A1A] border-1",
						input: "f600 text-[15px] text-[#fff] placeholder:text-[#666]",
					}}
					isRequired
					errorMessage="请输入名称"
					label={<span className="text-[14px] text-[#AAAAAA]">名称</span>}
					labelPlacement="outside-top"
					name="name"
					placeholder="请输入名称"
					variant="bordered"
					value={nameVal}
					onChange={(e) => setNameVal(e.target.value)}
					maxLength={20}
				/>

				{/* Ticker：强制大写 + 字距 + 验证 */}
				<Input
					classNames={{
						inputWrapper: "h-[48px] border-[#333] bg-[#1A1A1A] border-1",
						input: "f600 text-[15px] text-[#fff] placeholder:text-[#666] uppercase tracking-[-0.07px]",
					}}
					isRequired
					errorMessage="请输入Ticker"
					label={<span className="text-[14px] text-[#AAAAAA]">Ticker</span>}
					labelPlacement="outside-top"
					name="ticker"
					placeholder="请输入Ticker"
					variant="bordered"
					value={ticker}
					onChange={(e) => setTicker(e.target.value)}
					aria-label='ticker'
					maxLength={20}
				/>

				<Textarea
					classNames={{
						inputWrapper: "border-[#333] bg-[#1A1A1A] border-1",
						input: "f600 text-[15px] text-[#fff] placeholder:text-[#666]",
						label: "pb-[8px]",
					}}
					label={
						<div className="flex items-center gap-2">
							<span className="text-[14px] text-[#AAAAAA]">描述</span>
							<span className="text-[#666]">(可选)</span>
						</div>
					}
					labelPlacement="outside"
					placeholder="请输入描述"
					variant="bordered"
					name="description"
					aria-label="请输入描述"
					value={descriptionVal}
					onChange={(e) => setDescriptionVal(e.target.value)}
					maxLength={200}
				/>
				<Input
					classNames={{
						inputWrapper: "h-[48px] border-[#333] bg-[#1A1A1A] border-1",
						input: "f600 text-[15px] text-[#fff] placeholder:text-[#666]",
					}}
					label={
						<div className="flex items-center gap-2">
							<span className="text-[14px] text-[#AAAAAA]">提前买入</span>
							<span className="text-[#666]">(可选)</span>
						</div>
					}
					labelPlacement="outside-top"
					name="amount"
					placeholder="0.00"
					variant="bordered"
					type="text"
					aria-label="amount"
					value={amountVal}
					onChange={(e) => {
						const value = e.target.value;
						// 只允许数字和小数点，并限制小数位数
						if (value === '' || /^\d*\.?\d{0,6}$/.test(value)) {
							const numValue = parseFloat(value);
							// 限制最大值，比如不超过100 POP
							if (value === '' || numValue <= 100) {
								setAmountVal(value);
							}
						}
					}}
					endContent={<span className="text-[15px] text-[#fff]">POP</span>}
				/>
				{/* 社交链接 */}
				<Input
					classNames={{
						inputWrapper: "h-[48px] border-[#333] bg-[#1A1A1A] border-1",
						input: "f600 text-[15px] text-[#fff] placeholder:text-[#666]",
					}}
					label={
						<div className="flex items-center gap-2">
							<span className="text-[14px] text-[#AAAAAA]">X</span>
							<span className="text-[#666]">(可选)</span>
						</div>
					}
					labelPlacement="outside-top"
					name="x"
					placeholder="请输入 X 链接"
					variant="bordered"
					type="url"
					aria-label="X"
					value={xVal}
					onChange={(e) => setXVal(e.target.value)}
				/>
				<Input
					classNames={{
						inputWrapper: "h-[48px] border-[#333] bg-[#1A1A1A] border-1",
						input: "f600 text-[15px] text-[#fff] placeholder:text-[#666]",
					}}
					label={
						<div className="flex items-center gap-2">
							<span className="text-[14px] text-[#AAAAAA]">Telegram</span>
							<span className="text-[#666]">(可选)</span>
						</div>
					}
					labelPlacement="outside-top"
					name="telegram"
					placeholder='请输入 Telegram 链接'
					variant="bordered"
					type="url"
					aria-label='Telegram'
					value={telegramVal}
					onChange={(e) => setTelegramVal(e.target.value)}
				/>
				<Input
					classNames={{
						inputWrapper: "h-[48px] border-[#333] bg-[#1A1A1A] border-1",
						input: "f600 text-[15px] text-[#fff] placeholder:text-[#666]",
					}}
					label={
						<div className="flex items-center gap-2">
							<span className="text-[14px] text-[#AAAAAA]">网站</span>
							<span className="text-[#666]">(可选)</span>
						</div>
					}
					labelPlacement="outside-top"
					name="website"
					placeholder="请输入网站链接"
					variant="bordered"
					type="url"
					aria-label="请输入网站链接"
					value={websiteVal}
					onChange={(e) => setWebsiteVal(e.target.value)}
				/>
				<Button
					className={[
						"w-full h-[48px] text-[14px] mb-[30px] f600 full rounded-[12px]",
						readyToSubmit ? "bg-[#abf909] text-[#000] hover:bg-[#9AED2D]" : "bg-[rgba(148,152,159,0.65)] text-[#FFF]",
					].join(" ")}
					type="submit"
					aria-label='btn'
					isLoading={createLoading}
					disabled={createLoading || !readyToSubmit}
				>
					{createLoading ? "创建中..." : "立即创建"}
				</Button>
			</Form>
			<CreateSuccess
				isOpen={isSuccessOpen}
				onClose={() => {
					setIsSuccessOpen(false);
					resetForm();
				}}
				info={{
					addr: createdTokenAddress,
					image: avatarUrl,
					name: nameVal,
					symbol: ticker
				}}
			/>
		</>
	);
}
