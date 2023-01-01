import 'bulma/css/bulma.css'
import { useState, useEffect, useRef } from 'react'
import React from "react"
import Web3 from 'web3'
import Head from 'next/head'
import styles from '../styles/d_try.module.css'
import { useRouter } from "next/dist/client/router"
import Proposals from '../daoTabs/Proposals'
import CreateProposal from '../daoTabs/CreateProposal'
import VoteOnProposals from '../daoTabs/VoteOnProposals'
import WithdrawTokens from '../daoTabs/WithdrawTokens'
import SendVoterToken from '../daoTabs/SendVoterToken'
import SendYKToken from '../daoTabs/SendYKToken'
import ViewSubDAOs from '../daoTabs/ViewSubDAOs'
import CreateChildDAO from '../daoTabs/CreateChildDAO'
import Popup from '../components/Popup'
import CheckMyTokens from '../daoTabs/CheckMyTokens'
import Spinner from '../components/Spinner'
import ClawBack from '../daoTabs/ClawBack'
import Delegate from '../daoTabs/Delegate'
import DeleteDAO from '../daoTabs/DeleteDAO'

export default function Dao(){
    const router = useRouter();
    const address = router.query["address"];
    const [initialized, setInitialized] = useState(false);
    const [contracts, setContracts] = useState({daoContract: undefined, voterTokenContract: undefined, ykTokenContract: undefined, daoFactoryContract: undefined});
    const [selectedAccount, setSelectedAccount] = useState("")
    const [alertMessage,setAlertMessage] = useState({text: "", title: ""})
    const [daoInfo, setDaoInfo] = useState({name: "", description: "", total_voter_tokens: 0, total_yk_tokens: 0, total_proposals: 0, total_subdaos: 0})
    const [popupTrigger, setPopupTrigger] = useState(false)
    const [selectedNavItem, setSelectedNavItem] = useState(10);
    const dataDAO = require('../blockchain1/build/contracts/MyDAO.json');
    const dataToken = require('../blockchain1/build/contracts/SUToken.json');
    const dataFactory = require('../blockchain1/build/contracts/DAOFactory.json');

    useEffect(() => {
        const initializer = async () => {
            if (!initialized && address !== undefined) {
                await init();
                setInitialized(true);
            }
        }
        initializer();
    }, [router]);

        
    const connectWallethandler= async ()=>{
       if(typeof window !=="undefined" && typeof window.ethereum !== "undefined"){
           try {
            window.ethereum.request({method: "eth_requestAccounts"})
            setAlertMessage({text: "Successfully connected to a wallet", title: "Success"});
            setPopupTrigger(true);
           }
           catch(err){
                setAlertMessage({text: err.message, title: "Error"})
                setPopupTrigger(true)
           }
        }
       else{
            setAlertMessage({text: "Please install Metamask", title: "Error"})
            setPopupTrigger(true)
       }

    }

    const init = async () => {
        let provider = window.ethereum;
        let selectedAccount;
        
        if (typeof provider !== 'undefined') {
            provider
                .request({ method: 'eth_requestAccounts' })
                .then((accounts) => {
                    selectedAccount = accounts[0];
                })
                .catch((err) => {
                    setAlertMessage({text: err.message, title: "Error"});
                    setPopupTrigger(true);
                    return;
                });
    
            window.ethereum.on('accountsChanged', function (accounts) {
                selectedAccount = accounts[0];
                setAlertMessage({text: `Selected account changed to ${selectedAccount}`, title: "Warning"});
                setPopupTrigger(true)
            });
        }
    
        const web3 = new Web3(provider);
    
        //const networkId = await web3.eth.net.getId();
        // nftContract = new web3.eth.Contract(
        // 	NFTContractBuild.abi,
        // 	NFTContractBuild.networks[networkId].address
        // );
        //web3 = new Web3(window.ethereum);
        
        let daoContract, daoFactoryContract, voterTokenContract, ykTokenContract;

        try{
            daoFactoryContract=new web3.eth.Contract(
                dataFactory["abi"],
                '0xF0D4385644462Da93ae4c8378af180C8B4C98900'
            );
        }
        catch(err){
            setAlertMessage({text: "Invalid DAO factory address", title: "Error"});
            setPopupTrigger(true);
            return;
        }

        let daoExists;
        await daoFactoryContract.methods
          .dao_exists(address)
          .call()
          .then((result) => {
            daoExists = result;
          })
          .catch((err) => {
            setAlertMessage({ text: err.message, title: "Error" });
            setPopupTrigger(true);
          });
        
        if (!daoExists) {
            setAlertMessage({ text: "DAO does not exist", title: "Error" });
            setPopupTrigger(true);
            return;
        }

        try{
            daoContract=new web3.eth.Contract(
                dataDAO["abi"],
                address
            );
        }
        catch(err){
            setAlertMessage({text: "Invalid DAO address", title: "Error"});
            setPopupTrigger(true);
            return;
        }

        var daoName, daoDescription, numChildren, proposalNames;
        await daoFactoryContract.methods.num_children(String(address)).call().then((result) => {numChildren = result}).catch((err) => {setAlertMessage({text: err.message, title: "Error"}); setPopupTrigger(true)})
        await daoContract.methods.dao_name().call().then((result) => {daoName = result}).catch((err) => {setAlertMessage({text: err.message, title: "Error"}); setPopupTrigger(true)});
        await daoContract.methods.dao_description().call().then((result) => {daoDescription = result}).catch((err) => {setAlertMessage({text: err.message, title: "Error"}); setPopupTrigger(true)}); 
        await daoContract.methods.getProposalName().call().then((result) => {proposalNames = result}).catch((err) => {setAlertMessage({text: err.message, title: "Error"}); setPopupTrigger(true)});
        setDaoInfo({name: daoName, description: daoDescription, num_children: numChildren, total_proposals: proposalNames.length});
        
        let ykTokenAddress, voterTokenAddress;
        await daoContract.methods.voter_token().call().then((result)=>{ voterTokenAddress=result}).catch((err)=>{setAlertMessage({text: err.message, title: "Error"}); setPopupTrigger(true)})
        await daoContract.methods.yk_token().call().then((result)=>{ ykTokenAddress=result}).catch((err)=>{setAlertMessage({text: err.message, title: "Error"}); setPopupTrigger(true)})
        
        try{
            voterTokenContract=new web3.eth.Contract(
                dataToken["abi"],
                voterTokenAddress
            );
        }
        catch(err){
            setAlertMessage({text: "Invalid voter token address", title: "Error"});
            setPopupTrigger(true);
            return;
        }

        try{
            ykTokenContract=new web3.eth.Contract(
                dataToken["abi"],
                ykTokenAddress
            );
        }
        catch(err){
            setAlertMessage({text: "Invalid YK token address", title: "Error"});
            setPopupTrigger(true);
            return;
        }

        setContracts({daoContract: daoContract, daoFactoryContract: daoFactoryContract, voterTokenContract: voterTokenContract, ykTokenContract: ykTokenContract});
        setSelectedAccount(selectedAccount);    
    };

    async function getGasEstimation(contract, funcName, parameters) { //probably not useful
        let provider = window.ethereum;
        const web3 = new Web3(provider);
        const contractAddress = contract._address;
        const funcSig = web3.eth.abi.encodeFunctionSignature(`${funcName}(${parameters.map((p) => p.type).join(',')})`);
        const encodedParams = web3.eth.abi.encodeParameters(parameters.map((p) => p.type), parameters.map((p) => p.value));
        const data = funcSig + encodedParams.substring(2);
      
        try {
          const gasAmount = await web3.eth.estimateGas({
            to: contractAddress,
            data: data,
          });
          console.log(gasAmount);
          return gasAmount;
        } catch (error) {
          console.error(error);
          // handle the error
        }
      }

    const getGasLimit = async (contract, funcName, parameters) => {
        let provider = window.ethereum;
        const web3 = new Web3(provider);
        const contractAddress = contract._address;
        const encodedABI = contract.methods[funcName](...parameters).encodeABI();
        const gasLimit = await web3.eth.estimateGas({
            to: contractAddress,  // The address of the contract that contains the function
            data: encodedABI,
            from: selectedAccount,  // The address of the account you want to use to send the transaction
          }, function(error, gasAmount) {
            if (error) {
              console.error(error);
            } else {
              console.log('Estimated gas limit for the function:', gasAmount);
              gasLimit = gasAmount;
            }
        });
        return gasLimit;
    }

    const getGasPrice = async () => { //probably not gonna use this
        let provider = window.ethereum;
        const web3 = new Web3(provider);
        const gasPrice = await web3.eth.getGasPrice();
        console.log('Gas price:', gasPrice)
        return gasPrice;
    }

    const getDaoName = async (address_given) => {
        if (!initialized) {
            await init();
        }
        let provider = window.ethereum;
        
        const web3 = new Web3(provider);
        let daoABI=dataDAO["abi"]
        let tempDaoContract
        
        try {
            tempDaoContract = new web3.eth.Contract(
                daoABI,
                address_given
            );
        }
        catch(err) {
            setAlertMessage({text: "Invalid DAO Address", title: "Error"});
            setPopupTrigger(true);
            return;
        }

        let daoName;
        await tempDaoContract.methods.dao_name().call().then((result) => {daoName = result}).catch((err) => {setAlertMessage({text: err.message, title: "Error"}); setPopupTrigger(true)});
        return daoName;
    }

    const getDaoDescription = async (address_given) => {
        if (!initialized) {
            await init();
        }
        let provider = window.ethereum;
        const web3 = new Web3(provider);
        let daoABI=dataDAO["abi"]
        
        let tempDaoContract=new web3.eth.Contract(
            daoABI,
            address_given
        );
        let daoDescription;
        await tempDaoContract.methods.dao_description().call().then((result) => {daoDescription = result}).catch((err) => {setAlertMessage({text: err.message, title: "Error"}); setPopupTrigger(true)});
        return daoDescription;
    }

    const createNewProposal =async (name, description, vote, power)=> {
        
        if (!initialized) {
            await init();
        }

        var initial_votes = []
        for (var i = 0; i < vote.length ; i++) 
        {
            initial_votes.push(parseInt(0));
        }
        vote.forEach((element) => {
            element = String(element);
        });
        let gasLimit;
        
        await getGasLimit(contracts.daoContract, "createProposal", [String(name), String(description), vote, initial_votes, parseInt(power), 0]).then((result) => {gasLimit = result}).catch((err) => {setAlertMessage({text: err.message, title: "Error"}); setPopupTrigger(true)});
        await contracts.daoContract.methods.createProposal(String(name), String(description),vote, initial_votes, parseInt(power), 0).send({from: selectedAccount, gas: gasLimit}).then(() => {setAlertMessage({text: "Successfully created a proposal", title: "Success"}); setPopupTrigger(true)}).catch((err) => {setAlertMessage({text: err.message, title: "Error"}); setPopupTrigger(true)});
        return 0;
    }    

    const deleteThisDAO = async () => {
        if (!initialized) {
            await init();
        }
        let gasLimit;
        await getGasLimit(contracts.daoContract, "delete_this_dao", []).then((result) => {gasLimit = result}).catch((err) => {setAlertMessage({text: err.message, title: "Error"}); setPopupTrigger(true)});
        await contracts.daoContract.methods.delete_this_dao().send({from: selectedAccount, gas: gasLimit}).then(() => {setAlertMessage({text: "Successfully deleted the DAO", title: "Success"}); setPopupTrigger(true)}).catch((err) => {setAlertMessage({text: err.message, title: "Error"}); setPopupTrigger(true)});
        return 0;
    }

    const voteOnAProposal = async (id,vote,vote_power) => {
        if (!initialized) {
            await init();
        } 

        vote.forEach(element => {
            element = String(element)
        });
        vote_power.forEach(element => {
            element = parseInt(element)
        });
        let gasLimit;
        await getGasLimit(contracts.daoContract, "vote_power", [parseInt(id), vote, vote_power]).then((result) => {gasLimit = result}).catch((err) => {setAlertMessage({text: err.message, title: "Error"}); setPopupTrigger(true)});
        await contracts.daoContract.methods.vote_power(parseInt(id), vote, vote_power).send({from: selectedAccount, gas: gasLimit}).then(() => {setAlertMessage({text: "Successfully voted on a proposal", title: "Success"}); setPopupTrigger(true)}).catch((err) => {setAlertMessage({text: err.message, title: "Error"}); setPopupTrigger(true)})
        
        return 0;
    }

    const getAllProposals = async ()=> {
        
        if (!initialized) {
            await init();
        }
        var proposalNames
        await contracts.daoContract.methods.getProposalName().call().then((result) => {proposalNames = result}).catch((err) => {setAlertMessage({text: err.message, title: "Error"}); setPopupTrigger(true)});
        
        var proposals = []
        proposalNames.forEach((name, index) => {
            var proposal = {}
            proposal[index] = [name]
            proposals.push(proposal)
        })
        for (var i = 0; i < proposalNames.length; i++) {
            i = parseInt(i)
            await contracts.daoContract.methods.getProposalVoteNames(i).call().then((result) => {proposals[i][i].push(result)}).catch((err) => {setAlertMessage({text: err.message, title: "Error"}); setPopupTrigger(true)});
            await contracts.daoContract.methods.getProposalVoteNumbers(i).call().then((result) => {proposals[i][i].push(result)}).catch((err) => {setAlertMessage({text: err.message, title: "Error"}); setPopupTrigger(true)});
            await contracts.daoContract.methods.getProposalPower(i).call().then((result) => {proposals[i][i].push(result)}).catch((err) => {setAlertMessage({text: err.message, title: "Error"}); setPopupTrigger(true)});
            await contracts.daoContract.methods.getProposalType(i).call().then((result) => {proposals[i][i].push(result)}).catch((err) => {setAlertMessage({text: err.message, title: "Error"}); setPopupTrigger(true)});
            await contracts.daoContract.methods.votes(String(selectedAccount), i).call().then((result) => {proposals[i][i].push(result)}).catch((err) => {setAlertMessage({text: err.message, title: "Error"}); setPopupTrigger(true)});
            await contracts.daoContract.methods.getProposalDescription().call().then((result) => {proposals[i][i].push(result[i])}).catch((err) => {setAlertMessage({text: err.message, title: "Error"}); setPopupTrigger(true)});
        }
        
        return proposals;
    }    

    const sendVoterTokens = async (address, amount) => {
        if (!initialized) {
            await init();
        }
        let gasLimit;
        await getGasLimit(contracts.daoContract, "send_voter_tokens_to_address_yk_directly", [String(address), parseInt(amount)]).then((result) => {gasLimit = result}).catch((err) => {setAlertMessage({text: err.message, title: "Error"}); setPopupTrigger(true)});
        await contracts.daoContract.methods.send_voter_tokens_to_address_yk_directly(String(address), parseInt(amount)).send({from: selectedAccount, gas: gasLimit}).then(() => {setAlertMessage({text: "Successfully sent tokens", title: "Success"}); setPopupTrigger(true)}).catch((err) => {setAlertMessage({text: err.message, title: "Error"}); setPopupTrigger(true)})
    }

    const sendYKTokens = async (address, amount) => {
        if (!initialized) {
            await init();
        }
        let gasLimit;
        await getGasLimit(contracts.daoContract, "send_yk_tokens_to_address_yk_directly", [String(address), parseInt(amount)]).then((result) => {gasLimit = result}).catch((err) => {setAlertMessage({text: err.message, title: "Error"}); setPopupTrigger(true)});
        await contracts.daoContract.methods.send_yk_tokens_to_address_yk_directly(String(address), parseInt(amount)).send({from: selectedAccount, gas: gasLimit}).then(() => {setAlertMessage({text: "Successfully sent tokens", title: "Success"}); setPopupTrigger(true)}).catch((err) => {setAlertMessage({text: err.message, title: "Error"}); setPopupTrigger(true)})
    }

    const getVoterBalance = async () => {
        if (!initialized) {
            await init();
        }
        let voterBalance
        await contracts.voterTokenContract.methods.balanceOf(String(selectedAccount)).call().then((result) => {voterBalance = result}).catch((err) => {setAlertMessage({text: err.message, title: "Error"}); setPopupTrigger(true)})
        return voterBalance
    }

    const getYKBalance = async () => {
        if (!initialized) {
            await init();
        }
        let ykBalance
        await contracts.ykTokenContract.methods.balanceOf(String(selectedAccount)).call().then((result) => {ykBalance = result}).catch((err) => {setAlertMessage({text: err.message, title: "Error"}); setPopupTrigger(true)})
        return ykBalance
    }

    const getSubDAOs = async () => {
        if (!initialized) {
            await init();
        }
        let numChildren
        await contracts.daoFactoryContract.methods.num_children(String(address)).call().then((result) => {numChildren = result}).catch((err) => {setAlertMessage({text: err.message, title: "Error"}); setPopupTrigger(true)})

        let subDAOs = []
        for (var i = 0; i < numChildren; i++) {
            await contracts.daoFactoryContract.methods.parent_child_daos(String(address), parseInt(i)).call().then((result) => {subDAOs.push(result)}).catch((err) => {setAlertMessage({text: err.message, title: "Error"}); setPopupTrigger(true)})
        }
        return subDAOs
    }

    const getParentDAO = async () => {
        if (!initialized) {
            await init();
        }
        let parentDAOAddress
        await contracts.daoFactoryContract.methods.child_parent(String(address)).call().then((result) => {parentDAOAddress = result}).catch((err) => {setAlertMessage({text: err.message, title: "Error"}); setPopupTrigger(true)})

        return parentDAOAddress
    }

    const withdrawYKTokens = async (amount) => {
        if (!initialized) {
            await init();
        }
        let gasLimit;
        await getGasLimit(contracts.daoContract, "withdraw_yk_tokens", [parseInt(amount)]).then((result) => {gasLimit = result}).catch((err) => {setAlertMessage({text: err.message, title: "Error"}); setPopupTrigger(true)});
        await contracts.daoContract.methods.withdraw_yk_tokens(parseInt(amount)).send({from: selectedAccount, gas: gasLimit}).then(() => {setAlertMessage({text: "successfully withdrawn tokens", title: "Success"}); setPopupTrigger(true)}).catch((err) => {setAlertMessage({text: err.message, title: "Error"}); setPopupTrigger(true)})
    }

    const withdrawVoterTokens = async (amount) => {
        if (!initialized) {
            await init();
        }
        let gasLimit;
        await getGasLimit(contracts.daoContract, "withdraw_voter_tokens", [parseInt(amount)]).then((result) => {gasLimit = result}).catch((err) => {setAlertMessage({text: err.message, title: "Error"}); setPopupTrigger(true)});
        await contracts.daoContract.methods.withdraw_voter_tokens(parseInt(amount)).send({from: selectedAccount, gas: gasLimit}).then(() => {setAlertMessage({text: "successfully withdrawn tokens", title: "Success"}); setPopupTrigger(true)}).catch((err) => {setAlertMessage({text: err.message, title: "Error"}); setPopupTrigger(true)})
    }

    const getYKSharesToBeGiven = async () => {
        if (!initialized) {
            await init();
        }
        let shares;
        await contracts.daoContract.methods.yk_shares_to_be_given(String(selectedAccount)).call().then((result) => {shares = result}).catch((err) => {setAlertMessage({text: err.message, title: "Error"}); setPopupTrigger(true)})
        return shares
    }

    const getVoterSharesToBeGiven = async () => {
        if (!initialized) {
            await init();
        }
        let shares
        await contracts.daoContract.methods.voter_shares_to_be_given(String(selectedAccount)).call().then((result) => {shares = result}).catch((err) => {setAlertMessage({text: err.message, title: "Error"}); setPopupTrigger(true)})
        return shares
    }

    const createChildDAOFunc = async (name, description, ykTokenName, ykTokenSymbol, voterTokenName, voterTokenSymbol) => {
        if (!initialized) {
            await init();
        }
        let gasLimit;
        await getGasLimit(contracts.daoFactoryContract, "createChildDAO", [String(address), String(name), String(description), String(ykTokenName), String(ykTokenSymbol), String(voterTokenName), String(voterTokenSymbol)]).then((result) => {gasLimit = result}).catch((err) => {setAlertMessage({text: err.message, title: "Error"}); setPopupTrigger(true)});
        await contracts.daoFactoryContract.methods.createChildDAO(address, String(name), String(description), String(ykTokenName), String(ykTokenSymbol), String(voterTokenName), String(voterTokenSymbol)).send({from: selectedAccount, gas: gasLimit}).then(() => {setAlertMessage({text: "successfully created child DAO", title: "Success"}); setPopupTrigger(true)}).catch((err) => {setAlertMessage({text: err.message, title: "Error"}); setPopupTrigger(true)})
    }

    const delegateAllYK = async () => {
        if (!initialized) {
            await init();
        }
        let gasLimit;
        await getGasLimit(contracts.daoContract, "dao_delagation_multiple_getback_all_yk", []).then((result) => {gasLimit = result}).catch((err) => {setAlertMessage({text: err.message, title: "Error"}); setPopupTrigger(true)});
        await contracts.daoContract.methods.dao_delagation_multiple_getback_all_yk().send({from: selectedAccount, gas:gasLimit}).then(() => {setAlertMessage({text: "successfully delegated all YK tokens", title: "Success"}); setPopupTrigger(true)}).catch((err) => {setAlertMessage({text: err.message, title: "Error"}); setPopupTrigger(true)})
    }
    const delegateAllVoter = async () => {
        if (!initialized) {
            await init();
        }
        let gasLimit;
        await getGasLimit(contracts.daoContract, "dao_delagation_multiple_getback_all_voter", []).then((result) => {gasLimit = result}).catch((err) => {setAlertMessage({text: err.message, title: "Error"}); setPopupTrigger(true)});
        await contracts.daoContract.methods.dao_delagation_multiple_getback_all_voter().send({from: selectedAccount, gas: gasLimit}).then(() => {setAlertMessage({text: "successfully delegated all voter tokens", title: "Success"}); setPopupTrigger(true)}).catch((err) => {setAlertMessage({text: err.message, title: "Error"}); setPopupTrigger(true)})
    }
    const delegateAllFromAddressYK = async (address_wallet) => {
        if (!initialized) {
            await init();
        }
        let gasLimit;
        await getGasLimit(contracts.daoContract, "dao_delegation_single_getback_all_yk", [String(address_wallet)]).then((result) => {gasLimit = result}).catch((err) => {setAlertMessage({text: err.message, title: "Error"}); setPopupTrigger(true)});
        await contracts.daoContract.methodsdao_delegation_single_getback_all_yk(String(address_wallet)).send({from: selectedAccount, gas: gasLimit}).then(() => {setAlertMessage({text: "successfully delegated all YK tokens from address", title: "Success"}); setPopupTrigger(true)}).catch((err) => {setAlertMessage({text: err.message, title: "Error"}); setPopupTrigger(true)})
    }
    const delegateAllFromAddressVoter = async (address_wallet) => {
        if (!initialized) {
            await init();
        }
        let gasLimit;
        await getGasLimit(contracts.daoContract, "dao_delegation_single_getback_all_voter", [String(address_wallet)]).then((result) => {gasLimit = result}).catch((err) => {setAlertMessage({text: err.message, title: "Error"}); setPopupTrigger(true)});
        await contracts.daoContract.methods.dao_delegation_single_getback_all_voter(String(address_wallet)).send({from: selectedAccount, gas: gasLimit}).then(() => {setAlertMessage({text: "successfully delegated all voter tokens from address", title: "Success"}); setPopupTrigger(true)}).catch((err) => {setAlertMessage({text: err.message, title: "Error"}); setPopupTrigger(true)})
    }
    const delegateSomeFromAddressYK = async (address_wallet, amount_token) => {
        if (!initialized) {
            await init();
        }
        let gasLimit;
        await getGasLimit(contracts.daoContract, "dao_delegation_single_getback_amount_yk", [String(address_wallet), parseInt(amount_token)]).then((result) => {gasLimit = result}).catch((err) => {setAlertMessage({text: err.message, title: "Error"}); setPopupTrigger(true)});
        await contracts.daoContract.methods.dao_delegation_single_getback_amount_yk(String(address_wallet), parseInt(amount_token)).send({from: selectedAccount, gas: gasLimit}).then(() => {setAlertMessage({text: "successfully delegated some YK tokens from address", title: "Success"}); setPopupTrigger(true)}).catch((err) => {setAlertMessage({text: err.message, title: "Error"}); setPopupTrigger(true)})
    }
    const delegateSomeFromAddressVoter = async (address_wallet, amount_token) => {
        if (!initialized) {
            await init();
        }
        let gasLimit;
        await getGasLimit(contracts.daoContract, "dao_delegation_single_getback_amount_voter", [String(address_wallet), parseInt(amount_token)]).then((result) => {gasLimit = result}).catch((err) => {setAlertMessage({text: err.message, title: "Error"}); setPopupTrigger(true)});
        await contracts.daoContract.methods.dao_delegation_single_getback_amount_voter(String(address_wallet), parseInt(amount_token)).send({from: selectedAccount, gas: gasLimit}).then(() => {setAlertMessage({text: "successfully delegated some voter tokens from address", title: "Success"}); setPopupTrigger(true)}).catch((err) => {setAlertMessage({text: err.message, title: "Error"}); setPopupTrigger(true)})
    }
    const clawBackYKFromAll = async () => {
        if (!initialized) {
            await init();
        }
        let gasLimit;
        await getGasLimit(contracts.daoContract, "dao_clawback_all_yk", []).then((result) => {gasLimit = result}).catch((err) => {setAlertMessage({text: err.message, title: "Error"}); setPopupTrigger(true)});
        await contracts.daoContract.methods.dao_clawback_all_yk().send({from: selectedAccount, gas: gasLimit}).then(() => {setAlertMessage({text: "successfully clawed back all YK tokens", title: "Success"}); setPopupTrigger(true)}).catch((err) => {setAlertMessage({text: err.message, title: "Error"}); setPopupTrigger(true)})
    }
    const clawBackVoterFromAll = async () => {
        if (!initialized) {
            await init();
        }
        let gasLimit;
        await getGasLimit(contracts.daoContract, "dao_clawback_all_voter", []).then((result) => {gasLimit = result}).catch((err) => {setAlertMessage({text: err.message, title: "Error"}); setPopupTrigger(true)});
        await contracts.daoContract.methods.dao_clawback_all_voter().send({from: selectedAccount, gas: gasLimit}).then(() => {setAlertMessage({text: "successfully clawed back all voter tokens", title: "Success"}); setPopupTrigger(true)}).catch((err) => {setAlertMessage({text: err.message, title: "Error"}); setPopupTrigger(true)})
    }
    const clawBackYKFromSingleAddress = async (address_wallet) => {
        if (!initialized) {
            await init();
        }
        let gasLimit;
        await getGasLimit(contracts.daoContract, "dao_clawback_single_yk", [String(address_wallet)]).then((result) => {gasLimit = result}).catch((err) => {setAlertMessage({text: err.message, title: "Error"}); setPopupTrigger(true)});
        await contracts.daoContract.methods.dao_clawback_single_yk(String(address_wallet)).send({from: selectedAccount, gas: gasLimit}).then(() => {setAlertMessage({text: "successfully clawed back YK tokens from address", title: "Success"}); setPopupTrigger(true)}).catch((err) => {setAlertMessage({text: err.message, title: "Error"}); setPopupTrigger(true)})
    }
    const clawBackVoterFromSingleAddress = async (address_wallet) => {
        if (!initialized) {
            await init();
        }
        let gasLimit;
        await getGasLimit(contracts.daoContract, "dao_clawback_single_voter", [String(address_wallet)]).then((result) => {gasLimit = result}).catch((err) => {setAlertMessage({text: err.message, title: "Error"}); setPopupTrigger(true)});
        await contracts.daoContract.methods.dao_clawback_single_voter(String(address_wallet)).send({from: selectedAccount, gas: gasLimit}).then(() => {setAlertMessage({text: "successfully clawed back voter tokens from address", title: "Success"}); setPopupTrigger(true)}).catch((err) => {setAlertMessage({text: err.message, title: "Error"}); setPopupTrigger(true)})
    }

    const getHTMLBody = () => {
        return  selectedNavItem === 0 ?
                    <CreateChildDAO onCreateChildDAO={createChildDAOFunc}></CreateChildDAO>
                :
                selectedNavItem === 1 ?
                    <SendYKToken onSendTokens={sendYKTokens}></SendYKToken>
                :
                selectedNavItem === 2 ?
                <ClawBack  onClawBackYKFromAll={clawBackYKFromAll}
                    onClawBackYKFromSingleAddress={clawBackYKFromSingleAddress}
                    onClawBackVoterFromAll={clawBackVoterFromAll}
                    onClawBackVoterFromSingleAddress={clawBackVoterFromSingleAddress}></ClawBack>
                :
                selectedNavItem === 3 ?
                    <SendVoterToken onSendTokens={sendVoterTokens}></SendVoterToken>
                :
                selectedNavItem === 4 ?
                    <CreateProposal onCreateProposal={createNewProposal}></CreateProposal>
                :
                selectedNavItem === 5 ?
                    <DeleteDAO onDeleteDAO={deleteThisDAO}></DeleteDAO>
                :
                selectedNavItem === 6 ?
                    <CheckMyTokens onCheckYKBalance={getYKBalance} onCheckVoterBalance={getVoterBalance}></CheckMyTokens>
                :
                selectedNavItem === 7 ?
                    <WithdrawTokens onWithdrawVoterTokens={withdrawVoterTokens} onWithdrawYKTokens={withdrawYKTokens} onVoterSharesToBeGiven={getVoterSharesToBeGiven} onYKSharesToBeGiven={getYKSharesToBeGiven}></WithdrawTokens>
                : 
                selectedNavItem === 8 ?
                    <Delegate   onDelegateAllYK={delegateAllYK}
                        onDelegateAllTokensFromAddressYK={delegateAllFromAddressYK}
                        onDelegateSomeTokensFromAddressYK={delegateSomeFromAddressYK}
                        onDelegateAllVoter={delegateAllVoter}
                        onDelegateAllTokensFromAddressVoter={delegateAllFromAddressVoter}
                        onDelegateSomeTokensFromAddressVoter={delegateSomeFromAddressVoter}></Delegate>
                : 
                selectedNavItem === 9 ?
                    <VoteOnProposals onVoteOnProposals={voteOnAProposal} onGetAllProposals={getAllProposals}></VoteOnProposals>
                :
                selectedNavItem === 10 ?
                    <Proposals onGetAllProposals={getAllProposals}></Proposals>
                :
                selectedNavItem === 11 ?
                    <ViewSubDAOs onGetDAODescription={getDaoDescription} onGetDAOName={getDaoName} onGetSubDAOs={getSubDAOs} onGetParentDAO={getParentDAO}></ViewSubDAOs>
                :
                <></>
    }

    return(
    <div className={styles.main}>
        <Head>
            <title>DAO APP</title>
            <meta name="description" content="A blockchain dao app" />
            <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.2.0-beta1/dist/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-0evHe/X+R7YkIZDRvuzKMRqM+OrBnVFBL6DOitfPri4tjfHxaWutUpFmBp4vmVor" crossOrigin="anonymous"></link>
        </Head>
        <div className='bg-black' style={{minHeight:"100vh"}}>
            {
                !initialized?
                <Spinner></Spinner>
                :
                <div className="row mx-0">
                    <div className="col-xl-2 col-lg-3 col-md-3 col-sm-4 col-xs-6">
                        <div className='container p-2'>
                            <nav className="navbar navbar-expand-lg navbar-dark bg-black">
                                <img className="navbar-brand" alt='dao-symbol' width={ "48px"} src="https://previews.123rf.com/images/mingirov/mingirov1609/mingirov160900049/62776269-silver-chinese-calligraphy-translation-meaning-dao-tao-taoism-icon-on-black-background-vector-illust.jpg"/>
                                <span className="align-text-bottom mt-3">
                                    <a className="nav-link text-danger" href="/"><u>Go Back</u></a>
                                </span>
                            </nav>
                            <div className="input-group mb-3">
                                <input type="text" className="form-control" placeholder="Search" aria-label="Recipient's username" aria-describedby="basic-addon2"/>
                                <div className="input-group-append">
                                    <button className="btn btn-secondary btn-outline-white rounded-0" type="button">Button</button>
                                </div>
                            </div>
                            <div className="input-group-append" id="list-tab" role="tablist">
                                <button onClick={ connectWallethandler }  className="btn bg-transparent border border-white text-white mb-2" id="list-home-list" data-bs-toggle="list" href="#list-home" role="tab" aria-controls="home">Connect Wallet</button>
                            </div>
                        </div>
                        <ul className="nav flex-column my-2">
                            <li className="nav-item">
                                <h2 className='nav-link text-white'>Administrative</h2>
                            </li>
                            <li className="nav-item">
                                <p className="nav-link" style={{cursor:"pointer"}} onClick={() => { setSelectedNavItem(0)}}>Create a SubDAO</p>
                            </li>
                            <li className="nav-item">
                                <p className="nav-link" style={{cursor:"pointer"}} onClick={() => { setSelectedNavItem(1)}}>Assign a New YK</p>
                            </li>
                            <li className="nav-item">
                                <p className="nav-link" style={{cursor:"pointer"}} onClick={() => { setSelectedNavItem(2)}}>ClawBack Tokens</p>
                            </li>
                            <li className="nav-item">
                                <p className="nav-link" style={{cursor:"pointer"}} onClick={() => { setSelectedNavItem(3)}}>Send Voter Token</p>
                            </li>
                            <li className="nav-item">
                                <p className="nav-link" style={{cursor:"pointer"}} onClick={() => { setSelectedNavItem(4)}}>Create New Proposal</p>
                            </li>
                            <li className="nav-item">
                                <p className="nav-link" style={{cursor:"pointer"}} onClick={() => { setSelectedNavItem(5)}}>Delete DAO</p>
                            </li>
                        </ul>
                        <br/><br/>
                        <ul className="nav flex-column my-2">
                            <li className="nav-item">
                                <h2 className='nav-link text-white'>YK and Member Functions</h2>
                            </li>
                            <li className="nav-item">
                                <p className="nav-link" style={{cursor:"pointer"}} onClick={() => {setSelectedNavItem(6)}}>Check My Tokens</p>
                            </li>
                            <li className="nav-item">
                                <p className="nav-link" style={{cursor:"pointer"}} onClick={() => {setSelectedNavItem(7)}}>Withdraw Tokens</p>
                            </li>
                            <li className="nav-item">
                                <p className="nav-link" style={{cursor:"pointer"}} onClick={() => {setSelectedNavItem(8)}}>Delegate Tokens</p>
                            </li>
                        </ul>
                        <br/><br/>
                        <ul className="nav flex-column my-2">
                            <li className="nav-item">
                                <h2 className='nav-link text-white'>Member Functions</h2>
                            </li>
                            <li className="nav-item">
                                <p className='nav-link' style={{cursor:"pointer"}} onClick={() => {setSelectedNavItem(9)}}>Vote on Proposals</p>
                            </li>
                        </ul>
                        <br/><br/>
                        <ul className="nav flex-column my-2">
                            <li className="nav-item">
                                <h2 className='nav-link text-white'>Non-Member Functions</h2>
                            </li>
                            <li className="nav-item">
                                <p className="nav-link" style={{cursor:"pointer"}} onClick={() => {setSelectedNavItem(10)}}>View Proposals</p>
                            </li>
                            <li className="nav-item">
                                <p className="nav-link" style={{cursor:"pointer"}} onClick={() => {setSelectedNavItem(11)}}>View SubDAOs</p>
                            </li>
                        </ul>
                        <br/><br/>
                    </div>    
                    <div className="col-xl-10 col-lg-9 col-md-9 col-sm-8 col-xs-6">
                        <div className="container" style={{padding:"30px"}}>
                                <div className="row">
                                    <div className="col-xl-4 col-lg-3 col-md-2 col-sm-1 col-xs-1"></div>
                                    <div className="col-xl-4 col-lg-6 col-md-8 col-sm-10 col-xs-10">
                                        <div className="card mb-3">
                                            <img className="card-img-top rounded-0" alt='dao-image' src="https://redenom.com/info/wp-content/uploads/2018/10/redenom_cover_fb_1200x630_dao_1-1.png" alt="Card image cap"/>
                                            <div className="card-body">
                                                <h4 className="h4 card-title text-center text-black">{daoInfo.name}</h4>
                                                <br/>
                                                <p className="card-text"><small className="text-dark">Welcome!</small></p>
                                                <p className="card-text"><small className="text-dark">{daoInfo.description}</small></p>
                                                <p className="card-text"><small className="text-muted">{daoInfo.num_children} subDAOs</small></p>
                                                <p className="card-text"><small className="text-muted">{daoInfo.total_proposals} proposals created</small></p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="col-xl-4 col-lg-3 col-md-2 col-sm-1 col-xs-1"></div>
                                </div>
                                <div className='row mt-5'>
                                    {getHTMLBody()}
                                </div>
                            </div>
                        </div>
                    </div>
            }
        </div>
        <Popup trigger={popupTrigger} setTrigger={setPopupTrigger}>
            <h2 className='h2 text-black'>{alertMessage.title}</h2>
            <p>{alertMessage.text}</p>
        </Popup>
    </div>
    )
}