import { Modal, ModalContent, ModalHeader, ModalBody, Button, Input } from "@heroui/react";
import { CloseIcon } from "@/components/icons";
import { useSlippageStore } from "@/stores/slippage";
import { useState, useEffect } from "react";

interface SlippageProps {
	isOpen: boolean;
	onClose: () => void;
}

export default function Slippage({ isOpen, onClose }: SlippageProps) {
	const { slippage, setSlippage } = useSlippageStore();
	const [customValue, setCustomValue] = useState('');
	const [tempSlippage, setTempSlippage] = useState(slippage);

	// 预设滑点选项
	const presetSlippages = [10, 20, 30];

	// 当打开模态框时，同步当前滑点值
	useEffect(() => {
		if (isOpen) {
			setTempSlippage(slippage);
			// 如果当前滑点不在预设值中，显示在自定义输入框
			if (!presetSlippages.includes(slippage)) {
				setCustomValue(slippage.toString());
			} else {
				setCustomValue('');
			}
		}
	}, [isOpen, slippage]);

	// 处理预设按钮点击
	const handlePresetClick = (value: number) => {
		setTempSlippage(value);
		setCustomValue('');
	};

	// 处理自定义输入
	const handleCustomInput = (value: string) => {
		setCustomValue(value);
		const numValue = parseFloat(value);
		if (!isNaN(numValue) && numValue >= 0.1 && numValue <= 50) {
			setTempSlippage(numValue);
		}
	};

	// 确认设置
	const handleConfirm = () => {
		setSlippage(tempSlippage);
		onClose();
	};
	return (
		<>
			<Modal isOpen={isOpen} onOpenChange={(open) => !open && onClose()} hideCloseButton placement="center" size="sm"
				style={{
					borderRadius: "24px",
					border: "2px solid #FFF",
					background: "linear-gradient(180deg, #FFFDEB 0%, #FFF 70%)"
				}}
			>
				<ModalContent className="max-h-[80vh] overflow-y-auto">
					{() => (
						<>
							<ModalHeader className="text-center relative p-0 pt-[8px]">
								<div className="h-[48px] flex items-center justify-center w-full">设置滑点</div>
								<CloseIcon className="absolute right-[16px] top-[20px] cursor-pointer" onClick={onClose} />
							</ModalHeader>
							<ModalBody className="px-[16px] pb-[16px]">
								<div className="text-[13px] text-[#94989F]">设置交易中可接受的最大价格变动</div>
								<div className="flex items-center gap-[8px]">
									{presetSlippages.map((preset) => (
										<Button
											key={preset}
											fullWidth
											className={`h-[40px] rounded-[16px] text-[14px] text-[#24232A] ${tempSlippage === preset && !customValue
													? 'bg-[#FFE900]'
													: 'bg-[#EBEBEF] hover:bg-[#E0E0E0]'
												}`}
											onPress={() => handlePresetClick(preset)}
										>
											{preset}%
										</Button>
									))}
								</div>
								<Input
									classNames={{
										inputWrapper: "h-[48px] border-[#F5F6F9] bg-[#F5F6F9] border-1 rounded-[16px]",
										input: "text-[14px] text-[#24232A] placeholder:text-[#94989F] tracking-[-0.07px] text-center",
									}}
									name="customSlippage"
									placeholder="自定义 (0.1-50)"
									variant="bordered"
									value={customValue}
									onChange={(e) => handleCustomInput(e.target.value)}
									endContent={<span className="text-[14px] text-[#94989F]">%</span>}
								/>
								{customValue && (parseFloat(customValue) < 0.1 || parseFloat(customValue) > 50) && (
									<div className="text-[#FF4C4C] text-[12px] text-center">
										滑点应在 0.1% - 50% 之间
									</div>
								)}
								{tempSlippage > 10 && (
									<div className="text-[#FFA600] text-[12px] text-center">
										警告: 高滑点可能导致不利交易
									</div>
								)}
								<Button
									fullWidth
									className="h-[44px] bg-[#24232A] text-[15px] text-[#FFF] rounded-[16px] mt-[16px]"
									onPress={handleConfirm}
									isDisabled={customValue ? (parseFloat(customValue) < 0.1 || parseFloat(customValue) > 50) : false}
								>
									确认设置 {tempSlippage}%
								</Button>
							</ModalBody>
						</>
					)}
				</ModalContent>
			</Modal>
		</>
	);
}
