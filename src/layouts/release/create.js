import React, { useState, useEffect } from 'react';
import { useNavigate } from "react-router-dom";
import Modal from 'react-modal';
import { IssueLink, Issue, Title, Bottom, Assignees, AssigneeAvatar } from '../issue-manage/Lists/List/Issue/Styles.js';
import DatePicker from 'react-datepicker';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';

// @mui material components
import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import CircleIcon from '@mui/icons-material/Circle';
import { Icon, IconButton, Menu, MenuItem } from "@mui/material";
import InputLabel from '@mui/material/InputLabel';
import FormHelperText from '@mui/material/FormHelperText';
import FormControl from '@mui/material/FormControl';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import { useDropzone } from 'react-dropzone';
import DeleteIcon from '@mui/icons-material/Delete';
import { styled } from '@mui/system';
import MDSnackbar from '../../components/MDSnackbar/index.js';
// Material Dashboard 2 React components
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";

// Material Dashboard 2 React example components
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import MDInput from 'components/MDInput';
import MDButton from 'components/MDButton';
import MDProgress from 'components/MDProgress';
import MDBadge from "components/MDBadge";

import axios from 'axios';

import { useRecoilState } from 'recoil';
import { projectIdState } from '../../examples/Sidenav/ProjectIdAtom.js';
import Description from 'layouts/release/description';

const customModalStyles = {
    overlay: {
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        zIndex: '1000', // add a high zIndex value
    },
    content: {
        width: '60%',
        height: '80%',
        top: '50%',
        left: '55%',
        transform: 'translate(-50%, -45%)',
        display: 'flex',
        flexDirection: 'column',
        borderRadius: 20,
        position: 'relative', // make sure it's a positioned element
        zIndex: '10001', // it should be higher than overlay's zIndex to appear on top
        paddingTop: '3%'
    }
};
const DropzoneContainer = styled('div')({
    height: '150px',
    border: '2px dashed #cccccc',
    borderRadius: '4px',
    padding: '20px',
    textAlign: 'center',
    cursor: 'pointer',
    transition: 'border-color 0.3s ease-in-out',
    '&:hover': {
        borderColor: '#a0a0a0',
        background: '#f0f0f0', // Add background color on hover
    },
});

const ImageList = styled('div')({
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginTop: '20px',
});

const ImageContainer = styled('div')({
    margin: '10px',
    position: 'relative',
    transition: 'transform 0.3s ease-in-out',
    '&:hover': {
        transform: 'scale(1.1)',
    },
});

const Image = styled('img')({
    maxWidth: '100%',
    maxHeight: '100px',
    borderRadius: '4px',
});

const DeleteButton = styled('button')({
    position: 'absolute',
    top: '5px',
    right: '5px',
    background: 'transparent',
    color: 'gray',
    border: 'none',
    cursor: 'pointer',
    transition: 'color 0.3s ease-in-out',
    '&:hover': {
        color: 'red',
    },
});


function ViewRelease() {

    const [projectId, setProjectId] = useRecoilState(projectIdState);
    const [membersData, setMembersData] = useState([]); //프로젝트에 속한 멤버들 정보
    const [issueData, setIssueData] = useState([]); //릴리즈노트와 연관된 이슈들 정보
    const [otherIssueData, setOtherIssueData] = useState([]); //릴리즈노트에 연관되지 않았지만 추가할 수 있어야되므로 이 프로젝트의 나머지 이슈들 정보
    const [filteredIssues, setFilteredIssues] = useState([]); //릴리즈노트와 관련된 이슈들 필터링 및 정렬 위함
    const [files, setFiles] = useState([]);
    const [imageUrls, setImageUrls] = useState([]);
    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState(false);
    const [statusNo, setStatusNo] = useState([0, 0, 0]); //백로그, 진행중, 완료인 이슈 개수 세기
    const [issueDetail, setIssueDetail] = useState([]); //이슈 각각 눌렀을 때 상세정보
    const [sendImages, setSendImages] = useState([]);
    //POST 요청 위한 변수들
    const [version, setVersion] = useState('');
    const [state, setState] = useState(''); //우상단 상태 리스트 선택박스용
    const [progress, setProgress] = useState(0); //프로그레스바 전용
    const [brief, setBrief] = useState('');
    const [description, setDescription] = useState('');
    const [releaseDate, setReleaseDate] = useState(new Date());
    const [isVersionCorrect, setIsVersionCorrect] = useState(false);
    const [responseMessage, setResponseMessage] = useState();
    


    function getToday(date) {
        var year = date.getFullYear();
        var month = ("0" + (1 + date.getMonth())).slice(-2);
        var day = ("0" + date.getDate()).slice(-2);

        return year + "-" + month + "-" + day;
    }

    const handleReleaseDateChange = (date) => {
        setReleaseDate(date);
      };

    const onDrop = (acceptedFiles) => {
        const newImageUrls = acceptedFiles.map((file) => URL.createObjectURL(file));
        const newFiles = [...files, ...acceptedFiles];
        if (newFiles.length > 3) {
            newImageUrls.splice(3);
            newFiles.splice(3);
            setSnackbarOpen(true); // MDSnackbar 열기
            setSnackbarMessage('최대 3개 파일만 추가할 수 있습니다.');
        }
        setImageUrls([...imageUrls, ...newImageUrls]);
        setFiles(newFiles);
    };

    console.log(files);

    const deleteImage = (index) => {
        const newFiles = [...files];
        const newImageUrls = [...imageUrls];

        URL.revokeObjectURL(newImageUrls[index]);
        newImageUrls.splice(index, 1);
        newFiles.splice(index, 1);

        setImageUrls(newImageUrls);
        setFiles(newFiles);
    };


    const handleVersionChange = (e) => {

        const versionPattern = /^[0-9]+(\.[0-9]+){2}$/; // 릴리즈 노트 버전 포맷 x.y.z 
        setIsVersionCorrect(versionPattern.test(e.target.value));
        setVersion(e.target.value);
    }

    const navigate = useNavigate();

    const getStatusColor = (status) => {
        switch (status) {
            case 'done':
                return 'success';
            case 'backlog':
                return 'dark';
            case 'inprogress':
                return 'warning';
            default:
                return 'default';
        }
    }

    const getPriorityColor = (priority) => {
        if (priority >= 90) {
            return 'error';
        } else if (priority < 90 && priority >= 50) {
            return 'warning';
        } else {
            return 'info';
        }
    }

    const token = localStorage.getItem('ACCESS_TOKEN');

    //이 릴리즈 노트에 속하지 않은 프로젝트의 이슈 받아오기 (릴리즈 노트에 이슈를 추가하기 위한 용도)
    async function getOtherIssueData(projectId, token) {
        try {
            const response = await axios.get(`/api/project/${encodeURIComponent(projectId)}/issues`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setOtherIssueData(response.data.data);
        } catch (error) {
            console.error(error);
        }
    }

    async function getMembersData(projectId, token) {
        try {
            const response = await axios.get(`/api/project/${encodeURIComponent(projectId)}/members`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setMembersData(response.data.data);
        } catch (error) {
            console.error(error);
        }
    };

    async function postReleaseNoteData(token) {
        try {
            console.log("완료시 사진: ", files);
            const formData = new FormData();
            files.map(file => formData.append('image', file));
            const jsonData = {
                projectId: projectId,
                status: state,
                version: version,
                percent: progress,
                releaseDate: releaseDate,
                brief: brief,
                description: description,
                issueList: issueData
            };

            formData.append('jsonData', new Blob([JSON.stringify(jsonData)], {
                type: "application/json"
            }));

            const response = await axios.post(
                `/api/release/create`, formData,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'multipart/form-data'
                    },
                }
            );

            console.log("response release",response.data.statusCode);
 
            // const response = await axios.post(
            //     `/api/release/create`, {
            //     projectId: projectId,
            //     status: stßate,
            //     version: version,
            //     percent: progress,
            //     releaseDate: releaseDate,
            //     brief: brief,
            //     description: description,
            //     issueList: issueData,
            //     // attachedImage: formData
            //     formData
            // },
            //     {

            //         headers: { Authorization: `Bearer ${token}`, 
            //         'Content-Type': 'multipart/form-data'},
            //     }
            // );
            console.log("전송 완료");

            return response.data.statusCode;
        } catch (error) {
            console.error(error);
        }
    }

    useEffect(() => {
        getMembersData(projectId, token);
        getOtherIssueData(projectId, token);
    }, []);

    //릴리스 작성하기 버튼
    const handleRelaseUpdateOnClick = async (event) => {
        console.log("릴리즈 저장 버튼 클릭됨");
        
        const resultStatusCode = await postReleaseNoteData(token);  
            
        console.log("responseMessage",resultStatusCode == 445)
        if(resultStatusCode == 443){
            alert('해당 버전의 릴리즈 노트가 이미 존재합니다.');
        } else if(resultStatusCode == 445){
            alert('유효하지 않은 버전입니다. 적절한 상위 버전이 존재하는지 확인하세요.');
        } else {
            alert('릴리즈노트가 생성되었습니다!');
            navigate(-1);
        }
    };

    const [menu1, setMenu1] = useState(null); // 상태 필터
    const [menu2, setMenu2] = useState(null); // 담당자 필터
    const { getRootProps, getInputProps } = useDropzone({ onDrop, accept: 'image/*' });
    const openMenu1 = ({ currentTarget }) => setMenu1(currentTarget);
    const closeMenu1 = () => setMenu1(null);
    const openMenu2 = ({ currentTarget }) => setMenu2(currentTarget);
    const closeMenu2 = () => setMenu2(null);

    const handleShowAssignedIssues = (name) => {
        const filtered = issueData.filter((issue) => issue.memberIdInCharge && issue.memberIdInCharge.name === name);
        setFilteredIssues(filtered);
        setMenu2(null);
    };
    const handleShowBacklog = () => {
        const filteredIssues = issueData.filter((issue) => issue.status === 'backlog');
        setFilteredIssues(filteredIssues);
        setMenu1(null);
    };
    const handleShowInProgress = () => {
        const filteredIssues = issueData.filter((issue) => issue.status === 'inprogress');
        setFilteredIssues(filteredIssues);
        setMenu1(null);
    };
    const handleShowDone = () => {
        const filteredIssues = issueData.filter((issue) => issue.status === 'done');
        setFilteredIssues(filteredIssues);
        setMenu1(null);
    };
    const filterReset = () => {
        setFilteredIssues(issueData);
    }

    const memberList = membersData && membersData.map((member) => (
        <MenuItem key={member.name} onClick={() => handleShowAssignedIssues(member.name)}>
            {member.name}
        </MenuItem>
    ));

    // 이슈 상태 필터
    const renderMenu1 = (
        <Menu
            id="state-menu"
            anchorEl={menu1}

            open={Boolean(menu1)}
            onClose={closeMenu1}
        >
            <MenuItem onClick={handleShowBacklog}>Backlog</MenuItem>
            <MenuItem onClick={handleShowInProgress}>In progress</MenuItem>
            <MenuItem onClick={handleShowDone}>Done</MenuItem>
        </Menu>
    );

    // 이슈 담당자 필터
    const renderMenu2 = (
        <Menu
            id="member-menu"
            anchorEl={menu2}

            open={Boolean(menu2)}
            onClose={closeMenu2}
        >

            {memberList}
        </Menu>
    );

    // 우측상단 상태 선택 핸들링
    const handleChange = (event) => {
        setState(event.target.value);
    };

    const handlePercent = (event) => {
        let inputValue = event.target.value;
        if (Number.isNaN(Number(inputValue))) { inputValue = ''; }
        if (inputValue.length > 3) {
            inputValue = inputValue.slice(0, 3); // 최대 3글자까지만 유지
        }
        if (inputValue > 100) { inputValue = 100; }
        if (inputValue < 0) { inputValue = 0; }

        setProgress(inputValue);
    };

    const handleMemberInCharge = (event) => {
        setmemberInCharge(event.target.value);
    };

    const [activeModal, setActiveModal] = useState("");

    const openIssueAddModal = () => {
        setActiveModal("addIssue");
    };

    const openIssueInfoModal = (issue) => {
        setIssueDetail(issue);
        setActiveModal("issueInfo");
    };

    const closeModal = () => {
        setActiveModal(null);
    };

    // 이슈 추가하기
    const addIssue = (id) => {
        filterReset();
        const selectedIssue = otherIssueData.filter((issue) => issue.id === id);
        const addedIssues = issueData.concat(selectedIssue);
        const removedIssues = otherIssueData.filter((issue) => issue.id !== id);
        setIssueData(addedIssues);
        setFilteredIssues(addedIssues);
        setOtherIssueData(removedIssues);
    };

    // 이슈 제거하기
    const deleteIssue = (id) => {
        filterReset();
        const removedIssues = issueData.filter((issue) => issue.id !== id);
        const selectedIssue = filteredIssues.filter((issue) => issue.id === id);
        const addedIssues = otherIssueData.concat(selectedIssue);
        setIssueData(removedIssues);
        setFilteredIssues(removedIssues);
        setOtherIssueData(addedIssues);
        setActiveModal(null);
    }



    return (
        <DashboardLayout>
            <DashboardNavbar />
            <MDBox pt={3} pb={3}>
                <Grid container spacing={2}>
                    <Grid item xs={6}>
                        <Card>
                            <MDBox pt={2} px={3}>
                                <MDTypography variant="body2">
                                    릴리즈 버전: &nbsp;<MDInput variant="standard" onChange={handleVersionChange} multiline required />
                                    {(!isVersionCorrect) ? (<MDTypography fontWeight="light" color="error" variant="caption">&nbsp;&nbsp;버전 포맷은 "x.x.x"입니다. (예시 : 1.0.0)</MDTypography>) : <MDTypography> </MDTypography>}
                                </MDTypography>
                            </MDBox>
                            <MDBox pt={2} px={2} mb={2}>
                                <Card sx={{ backgroundColor: '#e9e9e9' }}>
                                    <MDBox pt={2} px={2} pb={2}>
                                        <MDTypography variant="body2" fontWeight="medium">
                                            요약
                                        </MDTypography>
                                        <MDBox pt={2} px={2}>
                                            <MDTypography variant="body2">
                                                <MDInput variant="standard" onChange={(e) => setBrief(e.target.value)} multiline fullWidth />
                                            </MDTypography>
                                        </MDBox>
                                    </MDBox>
                                </Card>
                            </MDBox>
                            <MDBox pt={2} px={2} mb={2}>
                                <Card sx={{ backgroundColor: '#e9e9e9' }}>
                                    <MDBox pt={2} px={2} pb={2}>
                                        <MDTypography variant="body2" fontWeight="medium">
                                            세부 설명
                                        </MDTypography>
                                        <MDBox pt={1} px={2}>
                                            <Description description={description} setDescription={setDescription} />
                                        </MDBox>
                                    </MDBox>
                                </Card>
                            </MDBox>
                            <MDBox pt={2} px={2} mb={4} >
                                <Card sx={{ backgroundColor: '#e9e9e9' }}>
                                    <MDBox pt={2} px={2} pb={2} >
                                        <Grid container spacing={0}>
                                            <Grid item xs={10}>
                                                <MDTypography variant="body2" fontWeight="medium">
                                                    관련 이슈
                                                </MDTypography>
                                            </Grid>
                                            <Grid item xs={2}>
                                                <MDButton size="small" color="black" onClick={openIssueAddModal}>
                                                    <AddCircleOutlineIcon color="white" />&nbsp; 추가
                                                </MDButton>
                                            </Grid>
                                            <Grid item xs={5}>
                                                <MDTypography variant="button">필터: &nbsp;</MDTypography>
                                                <MDButton size="small" color="dark" onClick={openMenu1}>상태</MDButton>
                                                {renderMenu1} &nbsp;
                                                <MDButton size="small" color="dark" onClick={openMenu2}>담당자</MDButton>
                                                {renderMenu2}
                                            </Grid>
                                            <Grid item xs={4}>
                                                <MDButton size="small" color="dark" onClick={filterReset}>필터 초기화</MDButton>
                                            </Grid>
                                        </Grid>
                                        <MDBox pt={1} px={2}>
                                            <MDBox pt={3} pl={1} pr={1} sx={{ overflow: "scroll", minHeight: "15vh", maxHeight: "50vh" }}>
                                                {filteredIssues.map((issue) => (
                                                    <div onClick={() => openIssueInfoModal(issue)}>
                                                        <Issue>
                                                            <Title>#{issue.issueNum} {issue.title}
                                                                <MDBadge
                                                                    badgeContent={issue.status}
                                                                    color={getStatusColor(issue.status)}
                                                                    variant="gradient"
                                                                    size="sm"
                                                                />

                                                                <MDBadge
                                                                    badgeContent={issue.issueType}
                                                                    color={getPriorityColor(issue.importance)}
                                                                    variant="gradient"
                                                                    size="sm"
                                                                />
                                                            </Title>
                                                            <Bottom>
                                                                <MDTypography variant="caption" fontWeight="light">담당자: {issue.memberIdInCharge.name}</MDTypography>
                                                            </Bottom>
                                                        </Issue>
                                                    </div>
                                                ))}
                                            </MDBox>
                                        </MDBox>
                                    </MDBox>
                                </Card>
                            </MDBox>
                        </Card>
                    </Grid>
                    <Grid item xs={6}>
                        <MDBox pt={3} px={3}>
                            <Grid container spacing={0}>
                                <Grid item xs={8}>
                                    <FormControl sx={{ mt: -2, pb: 2, minWidth: 120 }}>
                                        <InputLabel id="demo-simple-select-helper-label">상태</InputLabel>
                                        <Select
                                            value={state}
                                            label="릴리즈 상태"
                                            onChange={handleChange}
                                            sx={{ minHeight: 50 }}
                                        >
                                            <MenuItem value={"Not released"}>릴리즈 안됨(예정)</MenuItem>
                                            <MenuItem value={"Released"}>릴리즈 됨</MenuItem>
                                        </Select>
                                        <FormHelperText error={!state}>릴리즈 상태를 설정해주세요.</FormHelperText>
                                    </FormControl>
                                </Grid>
                                <Grid item m={2} xs={3} sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                                    <MDButton color="info" type="submit" sx={{ mt: -4, mb: 2 }} disabled={!isVersionCorrect || !state} onClick={handleRelaseUpdateOnClick} /*component={Link} to={"/release"}*/>
                                        <h6>생성</h6>
                                    </MDButton>
                                </Grid>
                                <Grid item xs={12}>
                                    <Card>
                                        <Grid container>
                                            <Grid item xs={6}>
                                                <MDBox pt={2} px={2}>
                                                    <MDTypography variant="h6">릴리즈 일자</MDTypography>
                                                    <MDBox mt={1} mb={2}>
                                                        <MDInput
                                                            type="text"
                                                            value={getToday(releaseDate)}
                                                            InputProps={{
                                                                startAdornment: (
                                                                    <DatePicker
                                                                        selected={releaseDate}
                                                                        onChange={handleReleaseDateChange}
                                                                        dateFormat="yyyy.MM.dd"
                                                                        showYearDropdown
                                                                        showMonthDropdown
                                                                        customInput={<CalendarTodayIcon />}
                                                                    />
                                                                ),
                                                            }}
                                                        />
                                                    </MDBox>
                                                </MDBox>
                                            </Grid>
                                            <Grid item xs={12}>
                                                <MDBox pt={2} px={2}>
                                                    <MDTypography variant="h6">진행률</MDTypography>
                                                    <MDInput variant="standard" value={progress} onChange={handlePercent} sx={{ width: "5%" }} multiline />  %
                                                    <MDProgress
                                                        value={progress <= 100 && progress >= 0 ? progress : progress > 100 ? 100 : 0}
                                                        color={progress < 30 ? "primary" : progress < 60 ? "error" : progress < 80 ? "warning" : "info"} variant="gradient" />
                                                </MDBox>
                                            </Grid>
                                        </Grid>
                                    </Card>
                                </Grid>
                                <Grid item xs={12} pt={5}>
                                    <Card>
                                        <Grid container>
                                            <Grid item xs={12}>
                                                <MDBox pt={2} px={1} mb={2}>
                                                    <MDTypography variant="h6">파일 첨부</MDTypography>
                                                    <div>
                                                        <DropzoneContainer {...getRootProps()}>
                                                            <input {...getInputProps()} />
                                                            <p>이미지 파일을 드래그하여 업로드하거나 클릭하여 이미지 선택 (최대 3개 파일만 가능)</p>
                                                        </DropzoneContainer>
                                                        <ImageList>
                                                            {files.map((file, index) => (
                                                                <ImageContainer key={file.name}>
                                                                    <Image src={imageUrls[index]} alt={file.name} />
                                                                    <DeleteButton onClick={() => deleteImage(index)}>
                                                                        <DeleteIcon />
                                                                    </DeleteButton>
                                                                </ImageContainer>
                                                            ))}
                                                        </ImageList>
                                                        <MDSnackbar
                                                            open={snackbarOpen}
                                                            autoHideDuration={3000}
                                                            onClose={() => setSnackbarOpen(false)}
                                                            content={snackbarMessage}
                                                            title="alert"
                                                            color='error'
                                                        />
                                                    </div>
                                                </MDBox>
                                            </Grid>
                                        </Grid>
                                    </Card>
                                </Grid>
                            </Grid>
                        </MDBox>
                    </Grid>
                </Grid >
            </MDBox >
            <Modal
                isOpen={activeModal === "addIssue"}
                onRequestClose={closeModal}
                style={customModalStyles}
            >
                <Card>
                    <MDBox
                        mx={2}
                        mt={-3}
                        py={3}
                        px={2}
                        variant="gradient"
                        bgColor="info"
                        borderRadius="lg"
                        coloredShadow="info"
                    >


                        <MDTypography variant="h6" color="white">
                            릴리즈 노트에 추가할 이슈 목록
                        </MDTypography>
                    </MDBox>
                    <MDBox pt={1} pl={1} pr={1}>
                        <MDTypography variant="caption" color="info" sx={{ ml: 1 }}>이슈를 추가하면 필터가 초기화 됩니다.</MDTypography>
                        {otherIssueData && otherIssueData.map((issue) => (
                            <Issue>
                                <Title>#{issue.issueNum} {issue.title}
                                    <MDBadge
                                        badgeContent={issue.status}
                                        color={getStatusColor(issue.status)}
                                        variant="gradient"
                                        size="sm"
                                    />
                                    <MDBadge
                                        badgeContent={issue.issueType}
                                        color={getPriorityColor(issue.importance)}
                                        variant="gradient"
                                        size="sm"
                                    /> <br />
                                    <MDTypography variant="caption" fontWeight="light"> 설명: {issue.description} </MDTypography>
                                </Title>
                                <Bottom>
                                    <MDTypography variant="caption" fontWeight="light">보고자: {issue.memberReport.name} / 담당자: {issue.memberIdInCharge.name} / 생성일: {issue.createdAt.slice(0, 10)}</MDTypography>
                                    <MDButton size="small" color="dark" onClick={() => addIssue(issue.id)}>릴리즈 노트에 추가하기</MDButton>
                                </Bottom>

                            </Issue>
                        ))}
                    </MDBox>
                </Card>
            </Modal>
            <Modal
                isOpen={activeModal === "issueInfo"}
                onRequestClose={closeModal}
                style={{
                    overlay: {
                        backgroundColor: 'rgba(0, 0, 0, 0.5)',
                        zIndex: '1000', // add a high zIndex value
                    },
                    content: {
                        width: '60%',
                        height: '80%',
                        top: '50%',
                        left: '55%',
                        transform: 'translate(-50%, -45%)',
                        display: 'flex',
                        flexDirection: 'column',
                        borderRadius: 20,
                        justifyContent: 'center',
                        position: 'relative', // make sure it's a positioned element
                        zIndex: '10001', // it should be higher than overlay's zIndex to appear on top
                    }
                }}
            >
                <MDBox pt={3}>
                    <Grid>
                        <Grid item xs={12}>
                            <MDBox
                                mx={2}
                                mt={-3}
                                py={3}
                                px={2}
                                variant="gradient"
                                bgColor="info"
                                borderRadius="lg"
                                coloredShadow="info"
                            >
                                <MDTypography variant="h6" color="white">
                                    Issue #{issueDetail.id}
                                </MDTypography>
                            </MDBox>
                            <MDBox component="form" role="form" mt={6} ml={3} mr={10}>
                                <MDBox mb={2}>
                                    <MDInput type="text" label="제목" defaultValue={issueDetail.title} disabled fullWidth />
                                </MDBox>
                                <MDBox mb={2}>
                                    <MDInput type="text" label="보고자" defaultValue={issueDetail.memberReport && issueDetail.memberReport.name} disabled fullWidth />
                                </MDBox>
                                <MDBox mb={2}>
                                    <MDInput type="text" label="담당자" defaultValue={issueDetail.memberIdInCharge && issueDetail.memberIdInCharge.name} disabled fullWidth />
                                </MDBox>
                                <MDBox mb={2}>
                                    <MDInput
                                        label="타입"
                                        value={issueDetail.issueType}
                                        disabled
                                    />
                                    <MDInput
                                        label="상태"
                                        value={issueDetail.status}
                                        sx={{ ml: 5 }}
                                        disabled
                                    />
                                </MDBox>
                                <MDBox mb={2}>
                                    <MDInput
                                        label="생성일"
                                        value={issueDetail.createdAt && issueDetail.createdAt.slice(0, 10)}
                                        disabled
                                    />
                                </MDBox>
                                <MDBox mb={2}>
                                    <MDInput type="textarea" label="설명" defaultValue={issueDetail.description} disabled rows={4} multiline fullWidth />
                                </MDBox>
                                <MDBox mb={2} display="flex" justifyContent="center" alignItems="center">
                                    <MDButton size="small" color="dark" onClick={() => deleteIssue(issueDetail.id)}>제거하기</MDButton>
                                </MDBox>

                            </MDBox>
                        </Grid>
                    </Grid>
                </MDBox>
            </Modal>
        </DashboardLayout >
    );
}

export default ViewRelease;