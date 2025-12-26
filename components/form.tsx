import React, { useEffect, useState } from "react";
import { Form, Input, Button, Textarea } from "@heroui/react";
import { useRouter } from "next/router";
import MyAvatar from "@/components/avatarImage"
import pinFileToIPFS from "@/utils/pinata";
import { toast } from "sonner";
import { useAccount, useWalletClient, usePublicClient } from 'wagmi';
import { ethers } from "ethers";
import FactoryABI from "@/constant/TokenFactory.abi.json";
import { CONTRACT_CONFIG, DEFAULT_CHAIN_ID, DEFAULT_CHAIN_CONFIG } from "@/config/chains";
import { randomBytes } from "crypto";
import { useIsMobile } from "@/utils/index";
import CreateSuccess from "./createSuccess";
import { FORM_STYLES, AVATAR_STYLES, ERROR_STYLES } from "@/constants/styles";
import { useTranslation } from 'react-i18next';
import { useReferral } from '@/providers/referralProvider';


const MAX_AVATAR_MB = 5;
const ACCEPTED_TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif"];

/** Error styles consistent with HeroUI Input */
function FieldError({ message }: { message?: string | null }) {
	if (!message) return null;
	return <p className={ERROR_STYLES.fieldError}>{message}</p>;
}

/** Avatar field: use "proxy validation input" to ensure avatar validation priority */
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
	const { t } = useTranslation('common');
	const inputId = "avatar-upload-input";
	const labelId = "avatar-upload-label";
	const wrapperRef = React.useRef<HTMLDivElement>(null);
	const fileInputRef = React.useRef<HTMLInputElement>(null);
	const [errorText, setErrorText] = React.useState<string | null>(null);

	// Expose clearFileInput method to parent component
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
			{/* Proxy validation input: keep at top, DOM participates in required validation (don't use display:none) */}
			<input
				// This input doesn't submit business data, only used for required validation order
				tabIndex={-1}
				aria-hidden="true"
				className={AVATAR_STYLES.hiddenInput}
				required={!!required}
				// Pass if there's avatar, empty triggers invalid if no avatar
				value={valueUrl ? "1" : ""}
				onChange={() => { }}
				// Hint synchronized with styles
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
					{t('form.icon')}
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
					{/* Actual file selection input: no longer required, let proxy control validation order */}
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
	const { t } = useTranslation('common');

	const [isSuccessOpen, setIsSuccessOpen] = useState(false);
	const isMobile = useIsMobile();
	const [ticker, setTicker] = useState("");
	const [nameVal, setNameVal] = useState("");

	// Avatar
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

	// Referral hook
	const { referralInviter, referralSignature, consumeReferralCode } = useReferral();

	// Wagmi hooks
	const { address, isConnected } = useAccount();
	const { data: walletClient } = useWalletClient();
	const publicClient = usePublicClient();
	const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
	const [signer, setSigner] = useState<ethers.JsonRpcSigner | null>(null);


	// Initialize provider and signer
	useEffect(() => {
		const initializeProvider = async () => {
			if (walletClient && publicClient) {
				try {
					// Create provider using walletClient transport
					const ethersProvider = new ethers.BrowserProvider(walletClient.transport);
					const ethersSigner = await ethersProvider.getSigner();

					setProvider(ethersProvider);
					setSigner(ethersSigner);
				} catch (error) {
					console.error("Failed to initialize provider:", error);
				}
			}
		};

		if (isConnected && walletClient) {
			initializeProvider();
		}
	}, [walletClient, publicClient, isConnected]);

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

		// Upload to IPFS
		try {
			setUploadLoading(true);
			const res = await pinFileToIPFS(file);
			if (res) {
				setIpfsHash(res);
				setAvatarFile(file);
				toast.success(t('messages.imageUploadSuccess'));
			} else {
				toast.error(t('messages.imageUploadFailed'));
				avatarFieldRef.current?.clearFileInput();
			}
		} catch (error) {
			console.error("IPFS upload error:", error);
			toast.error(t('messages.imageUploadFailed'));
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

	// Reset form data
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

	// Required fields: avatar, Name, Ticker all exist
	const requiredValid = !!avatarUrl && nameVal.trim().length > 0 && ticker.trim().length > 0;
	const readyToSubmit = requiredValid && isConnected;



	// Upload final JSON metadata to IPFS
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
				toast.error(t('messages.metadataUploadFailed'));
				setCreateLoading(false);
				return false;
			}
			return res;
		} catch (error) {
			console.error("Upload file error:", error);
			toast.error(t('messages.metadataUploadFailed'));
			setCreateLoading(false);
			return false;
		}
	};

	// Create token contract call
	const createToken = async (metadataHash: string) => {
		try {
			if (!address || !signer || !provider) {
				throw new Error("Wallet not connected");
			}
			const salt = randomBytes(32).toString("hex");

			// Check if there's pre-purchase amount
			const hasPreBuy = amountVal && parseFloat(amountVal) > 0;
			const preBuyAmount = hasPreBuy ? ethers.parseEther(amountVal) : BigInt(0);

			// Check balance if there's pre-purchase
			if (hasPreBuy) {
				const balance = await provider.getBalance(address);
				// Reserve some ETH for gas fees (estimated 0.01 ETH)
				const gasReserve = ethers.parseEther("0.01");
				const requiredAmount = preBuyAmount + gasReserve;

				if (balance < requiredAmount) {
					throw new Error(t('validation.insufficientBalanceForPrePurchase', {
						required: ethers.formatEther(preBuyAmount),
						available: ethers.formatEther(balance)
					}));
				}
			}

			const contract = new ethers.Contract(factoryAddr, FactoryABI, signer);

			// Estimate gas
			let gasLimit;
			try {
				if (hasPreBuy) {
					const tempInviter = referralInviter || ethers.ZeroAddress;
					const tempSignature = referralSignature || '0x';
					const tempInvite = { inviter: tempInviter };
					const estimatedGas = await contract.createTokenAndBuyWithReferral.estimateGas(
						nameVal,
						ticker,
						metadataHash,
						salt,
						preBuyAmount,
						tempInvite,
						tempSignature,
						{ value: preBuyAmount }
					);
					gasLimit = estimatedGas + (estimatedGas * BigInt(50)) / BigInt(100); // +50% buffer
				} else {
					const estimatedGas = await contract.createToken.estimateGas(
						nameVal,
						ticker,
						metadataHash,
						salt
					);
					gasLimit = estimatedGas + (estimatedGas * BigInt(50)) / BigInt(100); // +50% buffer
				}
				console.log("Estimated Gas Limit:", gasLimit.toString());
			} catch (e) {
				console.warn("Gas estimation failed:", e);
			}

			// Get gas price
			const gasPrice = (await provider.getFeeData()).gasPrice;
			const newGasPrice = gasPrice ? gasPrice + (gasPrice * BigInt(5)) / BigInt(100) : null;

			console.log("Gas Price:", {
				original: gasPrice?.toString(),
				new: newGasPrice?.toString(),
			});

			const txOptions = {} as any;
			if (gasLimit) txOptions.gasLimit = gasLimit;
			if (newGasPrice) txOptions.gasPrice = newGasPrice;
			console.log(txOptions)
			let txResult;
			try {
				if (hasPreBuy) {
					// Get referral data
					const referral = consumeReferralCode();
					let inviterAddress = ethers.ZeroAddress;
					let finalSignature = '0x';
					
					if (referral) {
						inviterAddress = referral.inviter;
						finalSignature = referral.signature;
						console.log("Using referral inviter:", inviterAddress);
					}
					
					const invite = { inviter: inviterAddress };
					console.log("createTokenAndBuyWithReferral params:", {
						nameVal,
						ticker,
						metadataHash,
						salt,
						preBuyAmount: preBuyAmount.toString(),
						invite,
						signature: finalSignature,
						txOptions
					});
					
					// Call createTokenAndBuyWithReferral
					txOptions.value = preBuyAmount;
					txResult = await contract.createTokenAndBuyWithReferral(
						nameVal,
						ticker,
						metadataHash,
						salt,
						preBuyAmount,
						invite,
						finalSignature,
						txOptions
					);
					console.log("createTokenAndBuyWithReferral transaction sent:", txResult.hash);
				} else {
					// Call createToken
					txResult = await contract.createToken(
						nameVal,
						ticker,
						metadataHash,
						salt,
						txOptions
					);
					console.log("createToken transaction sent:", txResult.hash);
				}

				toast.success(t('messages.transactionSubmitted'), {
					description: `${t('messages.transactionHash')}: ${txResult.hash.slice(0, 10)}...${txResult.hash.slice(-6)}`
				});
			} catch (error: any) {
				throw error;
			}

			// Wait for transaction confirmation
			const receipt = await txResult.wait();
			console.log("Transaction confirmed:", receipt);

			// Use predictTokenAddress to get newly created token address
			const tokenAddress = await contract.predictTokenAddress(salt);

			return tokenAddress;
		} catch (error) {
			throw error;
		}
	};

	const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		const form = e.currentTarget;

		// Uniformly trigger native validation once (follow DOM order, validate avatar proxy first)
		if (!form.checkValidity()) {
			form.reportValidity();
			return;
		}

		// Check wallet connection
		if (!isConnected || !address) {
			toast.error(t('messages.pleaseConnectWallet'));
			return;
		}

		// Check network connection
		if (!isConnected) {
			toast.error(t('messages.walletConnectionError'));
			return;
		}

		try {
			setCreateLoading(true);

			// 1. Upload final JSON metadata to IPFS
			const metadataHash = await uploadFile();
			if (!metadataHash) {
				toast.error(t('messages.metadataUploadRetry'));
				return; // uploadFile has already handled the error internally
			}

			// 2. Call contract to create token
			const tokenAddress = await createToken(metadataHash);
			if (!tokenAddress) {
				return; // createToken has already handled error prompts internally
			}

			// 3. Creation success handling
			setCreatedTokenAddress(tokenAddress as string);
			setIsSuccessOpen(true);
			toast.success(t('messages.tokenCreatedSuccess'));

			// 4. Invalidate related caches to ensure new token is displayed immediately
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
				// Don't block user flow, just log
			}

		} catch (error: any) {
			console.error("Create error:", error);

			// More detailed error handling
			if (error?.code === 4001 || error?.code === 'ACTION_REJECTED') {
				toast.error(t('messages.userCancelledTransaction'));
			} else if (error?.message?.includes("Insufficient balance for pre-purchase")) {
				toast.error(error.message);
			} else if (error?.message?.includes("insufficient funds")) {
				toast.error(t('messages.insufficientBalanceCheck'));
			} else if (error?.message?.includes("network")) {
				toast.error(t('messages.networkConnectionError'));
			} else {
				toast.error(t('messages.creationFailed'));
			}
		} finally {
			setCreateLoading(false);
		}
	};

	return (
		<>
			<Form className="w-full px-[16px] pt-[8px] gap-[24px]" onSubmit={onSubmit}>
				{/* Avatar (required, consistent prompt style) */}
				<AvatarField
					valueUrl={avatarUrl}
					onPick={onPickAvatar}
					onClear={onClearAvatar}
					required
					loading={uploadLoading}
					clearInput={avatarFieldRef}
				/>

				{/* Basic information */}
				<Input
					classNames={{
						inputWrapper: "h-[48px] border-[#333] bg-[#1A1A1A] border-1",
						input: "f600 text-[15px] text-[#fff] placeholder:text-[#666]",
					}}
					isRequired
					errorMessage={t('form.namePlaceholder')}
					label={<span className="text-[14px] text-[#AAAAAA]">{t('form.tokenName')}</span>}
					labelPlacement="outside-top"
					name="name"
					placeholder={t('form.namePlaceholder')}
					variant="bordered"
					value={nameVal}
					onChange={(e) => setNameVal(e.target.value)}
					maxLength={20}
				/>

				{/* Ticker: force uppercase + letter spacing + validation */}
				<Input
					classNames={{
						inputWrapper: "h-[48px] border-[#333] bg-[#1A1A1A] border-1",
						input: "f600 text-[15px] text-[#fff] placeholder:text-[#666] uppercase tracking-[-0.07px]",
					}}
					isRequired
					errorMessage={t('form.tickerPlaceholder')}
					label={<span className="text-[14px] text-[#AAAAAA]">{t('form.tokenSymbol')}</span>}
					labelPlacement="outside-top"
					name="ticker"
					placeholder={t('form.tickerPlaceholder')}
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
							<span className="text-[14px] text-[#AAAAAA]">{t('form.description')}</span>
							<span className="text-[#666]">{t('form.optional')}</span>
						</div>
					}
					labelPlacement="outside"
					placeholder={t('form.descriptionPlaceholder')}
					variant="bordered"
					name="description"
					aria-label="Please enter description"
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
							<span className="text-[14px] text-[#AAAAAA]">Pre-purchase</span>
							<span className="text-[#666]">{t('form.optional')}</span>
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
						// Only allow numbers and decimal points, limit decimal places
						if (value === '' || /^\d*\.?\d{0,6}$/.test(value)) {
							setAmountVal(value);
						}
					}}
					endContent={<span className="text-[15px] text-[#fff]">POP</span>}
				/>
				{/* Social links */}
				<Input
					classNames={{
						inputWrapper: "h-[48px] border-[#333] bg-[#1A1A1A] border-1",
						input: "f600 text-[15px] text-[#fff] placeholder:text-[#666]",
					}}
					errorMessage={t('validation.enterValidUrl')}
					label={
						<div className="flex items-center gap-2">
							<span className="text-[14px] text-[#AAAAAA]">{t('form.twitter')}</span>
							<span className="text-[#666]">{t('form.optional')}</span>
						</div>
					}
					labelPlacement="outside-top"
					name="x"
					placeholder={t('form.xPlaceholder')}
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
					errorMessage={t('validation.enterValidUrl')}
					label={
						<div className="flex items-center gap-2">
							<span className="text-[14px] text-[#AAAAAA]">{t('form.telegram')}</span>
							<span className="text-[#666]">{t('form.optional')}</span>
						</div>
					}
					labelPlacement="outside-top"
					name="telegram"
					placeholder={t('form.telegramPlaceholder')}
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
					errorMessage={t('validation.enterValidUrl')}
					label={
						<div className="flex items-center gap-2">
							<span className="text-[14px] text-[#AAAAAA]">{t('form.website')}</span>
							<span className="text-[#666]">{t('form.optional')}</span>
						</div>
					}
					labelPlacement="outside-top"
					name="website"
					placeholder={t('form.websitePlaceholder')}
					variant="bordered"
					type="url"
					aria-label="Please enter website link"
					value={websiteVal}
					onChange={(e) => setWebsiteVal(e.target.value)}
				/>
				<Button
					className={[
						"w-full h-[48px] text-[14px] f600 full rounded-[12px]",
						readyToSubmit ? "bg-[#abf909] text-[#000] hover:bg-[#9AED2D]" : "bg-[rgba(148,152,159,0.65)] text-[#FFF]",
					].join(" ")}
					type="submit"
					aria-label='btn'
					isLoading={createLoading}
					disabled={createLoading || !readyToSubmit}
				>
					{createLoading ? t('trade.creating') : t('trade.createNow')}
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
