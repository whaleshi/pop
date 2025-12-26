import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/router';

interface ReferralContextType {
	referralInviter: string | null;
	referralSignature: string | null;
	consumeReferralCode: () => { inviter: string; signature: string } | null;
	hasReferralCode: boolean;
}

const ReferralContext = createContext<ReferralContextType | undefined>(undefined);

export const ReferralProvider = ({ children }: { children: ReactNode }) => {
	const [referralInviter, setReferralInviter] = useState<string | null>(null);
	const [referralSignature, setReferralSignature] = useState<string | null>(null);
	const router = useRouter();

	useEffect(() => {
		const inviter = router.query.inviter as string;
		const signature = router.query.signature as string;
		if (inviter && signature && !referralInviter && !referralSignature) {
			setReferralInviter(inviter);
			setReferralSignature(signature);
			console.log('Referral inviter stored:', inviter);
			console.log('Referral signature stored:', signature);
		}
	}, [router.query.inviter, router.query.signature]);

	const consumeReferralCode = (): { inviter: string; signature: string } | null => {
		const inviter = referralInviter;
		const signature = referralSignature;
		if (inviter && signature) {
			setReferralInviter(null);
			setReferralSignature(null);
			console.log('Referral consumed:', { inviter, signature });
			return { inviter, signature };
		}
		return null;
	};

	return (
		<ReferralContext.Provider
			value={{
				referralInviter,
				referralSignature,
				consumeReferralCode,
				hasReferralCode: !!(referralInviter && referralSignature),
			}}
		>
			{children}
		</ReferralContext.Provider>
	);
};

export const useReferral = () => {
	const context = useContext(ReferralContext);
	if (context === undefined) {
		throw new Error('useReferral must be used within a ReferralProvider');
	}
	return context;
};
