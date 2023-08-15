import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from "react-router-dom";
import Modal from 'react-modal';
import { IssueLink, Issue, Title, Bottom, Assignees, AssigneeAvatar } from '../issue-manage/Lists/List/Issue/Styles.js';

// @mui material components
import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import { Icon, IconButton, Menu, MenuItem } from "@mui/material";
import InputLabel from '@mui/material/InputLabel';
import FormHelperText from '@mui/material/FormHelperText';
import FormControl from '@mui/material/FormControl';
import Select, { SelectChangeEvent } from '@mui/material/Select';
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
import Dropzone from './components/Dropzone.jsx';
import axios from 'axios';
import DatePicker from 'react-datepicker';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';

import { useRecoilState } from 'recoil';
import { projectIdState } from '../../examples/Sidenav/ProjectIdAtom.js';
import Description from "layouts/release/description";
import { DropzoneArea, DropzoneDialog } from 'material-ui-dropzone';
import MDSnackbar from '../../components/MDSnackbar/index.js';
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

function ViewRelease() {
    const { releaseId } = useParams();
    const [projectId, setProjectId] = useRecoilState(projectIdState);
    const [releaseNoteData, setReleaseNoteData] = useState([]); //해당 릴리즈노트 정보
    const [membersData, setMembersData] = useState([]); //프로젝트에 속한 멤버들 정보
    const [issueData, setIssueData] = useState([]); //릴리즈노트와 연관된 이슈들 정보
    const [otherIssueData, setOtherIssueData] = useState([]); //릴리즈노트에 연관되지 않았지만 추가할 수 있어야되므로 이 프로젝트의 나머지 이슈들 정보
    const [filteredIssues, setFilteredIssues] = useState([]); //릴리즈노트와 관련된 이슈들 필터링 및 정렬 위함
    const [memberInCharge, setmemberInCharge] = useState('');
    const [firstImgUrl, setFirstImgUrl] = useState();
    const [secondImgUrl, setSecondImgUrl] = useState();
    const [thirdImgUrl, setThirdImgUrl] = useState();

    const [statusNo, setStatusNo] = useState([0, 0, 0]); //백로그, 진행중, 완료인 이슈 개수 세기
    const [issueDetail, setIssueDetail] = useState([]); //이슈 각각 눌렀을 때 상세정보

    //POST 요청 위한 변수들
    const [version, setVersion] = useState('');
    const [state, setState] = useState(''); //우상단 상태 리스트 선택박스용
    const [progress, setProgress] = useState(0); //프로그레스바 전용
    const [brief, setBrief] = useState('');
    const [description, setDescription] = useState('');
    const [releaseDate, setReleaseDate] = useState(new Date());
    const [createDate, setCreateDate] = useState(new Date());
    const [isVersionCorrect, setIsVersionCorrect] = useState(true);
    const [snackbarOpen, setSnackbarOpen]= useState(false);
    const [snackbarMessage, setSnackbarMessage]= useState(false);
    const navigate = useNavigate();
    const token = localStorage.getItem('ACCESS_TOKEN');


    const handleVersionChange = (e) => {

        const versionPattern = /^[0-9]+(\.[0-9]+){2}$/; // 릴리즈 노트 버전 포맷 x.y.z 
        setIsVersionCorrect(versionPattern.test(e.target.value));
        setVersion(e.target.value);
    }

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



    // 이 릴리즈노트의 정보 받아오기
    async function getReleaseNoteData(releaseId, token) {
        try {
            const response = await axios.get(`/api/release/${encodeURIComponent(releaseId)}`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            setReleaseNoteData(response.data.data);
            setVersion(response.data.data.version);
            setBrief(response.data.data.brief);
            setDescription(response.data.data.description);
            setState(response.data.data.status);
            setProgress(response.data.data.percent);
            setReleaseDate(new Date(response.data.data.releaseDate));
            setmemberInCharge(response.data.data.member && response.data.data.member.username);
            setFirstImgUrl(response.data.data.imgUrl_1);
            setSecondImgUrl(response.data.data.imgUrl_2);
            setThirdImgUrl(response.data.data.imgUrl_3);
            setCreateDate(new Date(response.date.createdAt));
            console.log(releaseDate);
        } catch (error) {
            console.error(error);
        }
    };

    const [dialogInitialFiles, setDialogInitialFiles] = useState([]);

    function getToday(date) {
        var year = date.getFullYear();
        var month = ("0" + (1 + date.getMonth())).slice(-2);
        var day = ("0" + date.getDate()).slice(-2);

        return year + "-" + month + "-" + day;
    }

    const handleReleaseDateChange = (date) => {
        setReleaseDate(date);
      };

    useEffect(() => {
        setDialogInitialFiles([
            process.env.REACT_APP_KIC_OBJECT_STORAGE + releaseNoteData.imgUrl_1,
            process.env.REACT_APP_KIC_OBJECT_STORAGE + releaseNoteData.imgUrl_2,
            process.env.REACT_APP_KIC_OBJECT_STORAGE + releaseNoteData.imgUrl_3
        ].filter(url => url !== "" && url !== process.env.REACT_APP_KIC_OBJECT_STORAGE && url !== (process.env.REACT_APP_KIC_OBJECT_STORAGE + 'null')));
    }, [releaseNoteData]);
  
    // 이 릴리즈 노트에 속한 이슈 받아오기
    async function getIssueData(releaseId, token) {
        try {
            const response = await axios.get(`/api/releaseNote/${encodeURIComponent(releaseId)}/issues`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const counts = [0, 0, 0];
            setIssueData(response.data.data);
            setFilteredIssues(response.data.data);

            // (response.data.data).forEach((issue) => {
            //     if (issue.status === 'backlog') {
            //         counts[0]++;
            //     } else if (issue.status === 'inprogress') {
            //         counts[1]++;
            //     } else if (issue.status === 'done') {
            //         counts[2]++;
            //     }
            // });
            // setStatusNo(counts);

        } catch (error) {
            console.error(error);
        }
    };

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

    async function putReleaseNoteData(token) {
        try {
            const response = await axios.put(
                `/api/release/update`, {
                projectId: projectId,
                releaseId: releaseId,
                status: state,
                version: version,
                percent: progress,
                releaseDate: releaseDate,
                brief: brief,
                description: description,
                issueList: issueData
            },
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );
            console.log("전송 완료");
        } catch (error) {
            console.error(error);
        }
    }

    useEffect(() => {
        getReleaseNoteData(releaseId, token);
        getIssueData(releaseId, token);
        getMembersData(projectId, token);
        getOtherIssueData(projectId, token);
    }, []);

    //릴리스 작성하기 버튼
    const handleReleaseUpdateOnClick = (event) => {
        putReleaseNoteData(token);
        alert('수정사항이 반영되었습니다!');
        navigate(-1);
    };

    const [menu1, setMenu1] = useState(null); // 상태 필터
    const [menu2, setMenu2] = useState(null); // 담당자 필터

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
        const addedIssues = issueData ? issueData.concat(selectedIssue) : selectedIssue;
        const removedIssues = otherIssueData.filter((issue) => issue.id !== id);
        setIssueData(addedIssues);
        setFilteredIssues(addedIssues);
        setOtherIssueData(removedIssues);
    };


    const onClickSubmitButton = (uploadedFiles) => {
          const formData = new FormData();
          uploadedFiles.forEach((file) => {
            formData.append('image', file);
          });
      
          axios
            .post(`/api/releaseNote/${releaseId}/images`, formData, {
              headers: {
                'Content-Type': 'multipart/form-data',
              },
            })
            .then((response) => {
              console.log('Upload successful!', response.data);
              setSnackbarOpen(true); // MDSnackbar 열기
            setSnackbarMessage('파일을 저장 완료했습니다.');
            })
            .catch((error) => {
              console.error('Error uploading the image:', error);
            });
      };

    


    // 이슈 제거하기
    const deleteIssue = (id) => {
        filterReset();
        const removedIssues = issueData.filter((issue) => issue.id !== id);
        const selectedIssue = filteredIssues.filter((issue) => issue.id === id);
        const addedIssues = issueData ? otherIssueData.concat(selectedIssue) : selectedIssue;
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
                                    릴리즈 버전: &nbsp;<MDInput variant="standard" defaultValue={releaseNoteData.version} onChange={handleVersionChange} multiline required />
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
                                                <MDInput variant="standard" defaultValue={releaseNoteData.brief} onChange={(e) => setBrief(e.target.value)} multiline fullWidth />
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
                            <MDBox pt={2} px={2} mb={4}>
                                <Card sx={{ backgroundColor: '#e9e9e9' }}>
                                    <MDBox pt={2} px={2} pb={2}>
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
                                            <MDBox pt={3} pl={1} pr={1} sx={{ overflow: "scroll", maxHeight: "50vh" }}>
                                                {filteredIssues && filteredIssues.map((issue) => (
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
                                    <MDButton color="info" type="submit" sx={{ mt: -4, mb: 2 }} disabled={!isVersionCorrect} onClick={handleReleaseUpdateOnClick} /*component={Link} to={"/release"}*/>
                                        <h6>수정</h6>
                                    </MDButton>
                                </Grid>
                                <Grid item xs={12}>
                                    <Card>
                                        <Grid container>
                                            <Grid item xs={6}>
                                                <MDBox pt={2} px={2}>
                                                    <MDTypography variant="h6">생성 일자</MDTypography>
                                                    <MDBox mt={1} mb={2}>
                                                        <MDInput
                                                            type="text"
                                                            value={getToday(createDate)}
                                                            InputProps={{
                                                                startAdornment: (
                                                                    <DatePicker
                                                                        selected={createDate}
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
                                                    <MDTypography variant="h6">작성자</MDTypography>
                                                    <MDTypography variant="subtitle2" ml={1}>
                                                        {releaseNoteData.member && releaseNoteData.member.username}
                                                    </MDTypography>
                                                    {/* <Select
                                                        labelId="demo-simple-select-helper-label"
                                                        id="demo-simple-select-helper"
                                                        value={memberInCharge}
                                                        onChange={handleMemberInCharge}
                                                        sx={{ minHeight: 50 }}
                                                    >
                                                        {memberList2}
                                                    </Select> */}
                                                </MDBox>
                                            </Grid>
                                            <Grid item xs={12}>
                                                <MDBox pt={2} px={2} pb={5}>
                                                    <MDTypography variant="h6">진행률</MDTypography>
                                                    <MDInput variant="standard" value={progress} onChange={handlePercent} sx={{ width: "5%" }} multiline />  %
                                                    <MDProgress
                                                        value={progress <= 100 && progress >= 0 ? progress : progress > 100 ? 100 : 0}
                                                        color={progress < 30 ? "primary" : progress < 60 ? "error" : progress < 80 ? "warning" : "info"} variant="gradient" />
                                                </MDBox>
                                            </Grid>
                                            {/* <Grid item xs={12}>
                                                <MDBox pt={6} px={2} pb={3}>
                                                    <MDTypography variant="h6">
                                                        해당 릴리즈 노트 관련 이슈
                                                    </MDTypography>
                                                    <MDTypography variant="subtitle2">
                                                        백로그: {statusNo[0]}<br />
                                                        진행중: {statusNo[1]}<br />
                                                        완료: {statusNo[2]}
                                                    </MDTypography>
                                                </MDBox>
                                            </Grid> */}
                                        </Grid>
                                    </Card>
                                    <br></br>
                                    <Card >
                                        <Grid container>
                                            <Grid item xs={12}>
                                                <MDBox pt={2} px={2} mb={2}>
                                                    <MDTypography variant="h6">첨부 파일</MDTypography>
                                                    <Dropzone
                                                        onClick={onClickSubmitButton}
                                                        initialFiles={dialogInitialFiles}
                                                    />
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
                                <MDBox mb={2} ml={3} display="flex" justifyContent="center" alignItems="center">
                                    <MDButton size="small" color="dark" onClick={() => deleteIssue(issueDetail.id)}>릴리즈 노트에서 제거하기</MDButton>
                                </MDBox>

                            </MDBox>
                        </Grid>
                    </Grid>
                </MDBox>
            </Modal>
            <MDSnackbar
                open={snackbarOpen}
                autoHideDuration={3000}
                onClose={() => setSnackbarOpen(false)}
                content={snackbarMessage}
                title = "Alert"
            />
        </DashboardLayout >
    );
}

export default ViewRelease;