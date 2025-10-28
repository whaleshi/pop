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

	// Preset slippage options
	const presetSlippages = [10, 20, 30];

	// When opening the modal, synchronize the current slippage value
	useEffect(() => {
		if (isOpen) {
			setTempSlippage(slippage);
			// If the current slippage is not in the preset values, show it in the custom input
			if (!presetSlippages.includes(slippage)) {
				setCustomValue(slippage.toString());
			} else {
				setCustomValue('');
			}
		}
	}, [isOpen, slippage]);

	// Handle preset button click
	const handlePresetClick = (value: number) => {
		setTempSlippage(value);
		setCustomValue('');
	};

	// Handle custom input
	const handleCustomInput = (value: string) => {
		setCustomValue(value);
		const numValue = parseFloat(value);
		if (!isNaN(numValue) && numValue >= 0.1 && numValue <= 50) {
			setTempSlippage(numValue);
		}
	};

	// Confirm settings
	const handleConfirm = () => {
		setSlippage(tempSlippage);
		onClose();
	};
	return (
		<>
			<Modal isOpen={isOpen} onOpenChange={(open) => !open && onClose()} hideCloseButton placement="center" size="sm"
				style={{
					borderRadius: "24px",
					border: "2px solid #333",
					background: "#1A1A1A"
				}}
			>
				<ModalContent className="max-h-[80vh] overflow-y-auto">
					{() => (
						<>
							<ModalHeader className="text-center relative p-0 pt-[8px]">
								<div className="h-[48px] flex items-center justify-center w-full text-[#fff]">Set Slippage</div>
								<CloseIcon className="absolute right-[16px] top-[20px] cursor-pointer" onClick={onClose} />
							</ModalHeader>
							<ModalBody className="px-[16px] pb-[16px]">
								<div className="text-[13px] text-[#AAAAAA]"></div>
								<div className="flex items-center gap-[8px]">
									{presetSlippages.map((preset) => (
										<Button
											key={preset}
											fullWidth
											className={`h-[40px] rounded-[16px] text-[14px] transition-colors ${tempSlippage === preset && !customValue
												? 'bg-[#9AED2D] text-[#000]'
												: 'bg-[#333] text-[#fff] hover:bg-[#444]'
												}`}
											onPress={() => handlePresetClick(preset)}
										>
											{preset}%
										</Button>
									))}
								</div>
								<Input
									classNames={{
										inputWrapper: "h-[48px] border-[#333] bg-[#1A1A1A] border-1 rounded-[16px]",
										input: "text-[14px] text-[#fff] placeholder:text-[#666] tracking-[-0.07px] text-center",
									}}
									name="customSlippage"
									placeholder="Custom (0.1-50)"
									variant="bordered"
									value={customValue}
									onChange={(e) => handleCustomInput(e.target.value)}
									endContent={<span className="text-[14px] text-[#AAAAAA]">%</span>}
								/>
								{customValue && (parseFloat(customValue) < 0.1 || parseFloat(customValue) > 50) && (
									<div className="text-[#FF4C4C] text-[12px] text-center">
										Slippage should be between 0.1% - 50%
									</div>
								)}
								{tempSlippage > 10 && (
									<div className="text-[#FFA600] text-[12px] text-center">
										Warning: High slippage may result in unfavorable trades
									</div>
								)}
								<Button
									fullWidth
									className="h-[44px] bg-[#9AED2D] text-[15px] text-[#000] rounded-[16px] mt-[16px] hover:bg-[#7ED321] transition-colors"
									onPress={handleConfirm}
									isDisabled={customValue ? (parseFloat(customValue) < 0.1 || parseFloat(customValue) > 50) : false}
								>
									Confirm Settings {tempSlippage}%
								</Button>
							</ModalBody>
						</>
					)}
				</ModalContent>
			</Modal>
		</>
	);
}
