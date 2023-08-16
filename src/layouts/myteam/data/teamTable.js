/* eslint-disable react/prop-types */
/* eslint-disable react/function-component-definition */

// Material Dashboard 2 React components
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import MDAvatar from "components/MDAvatar";
import MDBadge from "components/MDBadge";

import { useState, useEffect } from "react";
import axios from 'axios';

// Images
import defimg from "assets/images/default_avatar.jpg";

import { useRecoilState } from 'recoil';
import { projectIdState } from '../../../examples/Sidenav/ProjectIdAtom.js';

const getProjectMemberData = async (projectId, token) => {
  try {
    const response = await axios.get(`/api/project/${encodeURIComponent(projectId)}/members`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    
    if (response.data.length === 0) {
      return [];
    } else {
      console.log("aaaaa");
      return response.data.data;
    }
  } catch (error) {
    console.error(error);
    return [];
  }
};

export default function data() {
  const [projectId, setProjectId] = useRecoilState(projectIdState);
  const [memberList, setMemberList] = useState([]);

  const token = localStorage.getItem('ACCESS_TOKEN');

  useEffect(() => {
    async function fetchData() {
      const data = await getProjectMemberData(projectId, token);
      setMemberList(data);
      console.log(data);
    }
    fetchData();
    const intervalId = setInterval(fetchData, 10000);

  // 컴포넌트가 언마운트되면 인터벌 정리
  return () => {
    clearInterval(intervalId);
  };
  }, []);
  
  const Author = ({ image, name, nickname }) => {
    const [avimage, setImage] = useState(image);
    const handleImageError = () => {
      setImage(defimg);
    };
    return (
    <MDBox display="flex" alignItems="center" lineHeight={1}>
      <MDAvatar src={avimage} onError={handleImageError} name={name} size="sm"/>
      <MDBox ml={2} lineHeight={1}>
        <MDTypography display="block" variant="button" fontWeight="medium">
          {name}
        </MDTypography>
        <MDTypography variant="caption">{nickname}</MDTypography>
      </MDBox>
    </MDBox>
  )};

  const Job = ({ title, description }) => (
    <MDBox lineHeight={1} textAlign="left">
      <MDTypography display="block" variant="caption" color="text" fontWeight="medium">
        {title}
      </MDTypography>
      <MDTypography variant="caption">{description}</MDTypography>
    </MDBox>
  );
  const columns = [
    { Header: "팀원", accessor: "author", width: "45%", align: "left" },
    { Header: "직책/역할", accessor: "function", align: "left" },
    { Header: "접속", accessor: "status", align: "center" },
    { Header: "이슈 해결 점수", accessor: "exp", align: "center" },
    { Header: "가입일", accessor: "createdAt", align: "center" },
  ];
  
  const rows = memberList.map((member) => ({
    author: (
      <Author image={"https://objectstorage.kr-gov-central-1.kakaoicloud-kr-gov.com/v1/ff71cfd6bffa41b5ba1c19d02635640f/releasy/profile%2F" + member.memberId } name={member.name} email={member.email} />
    ),
    function: <Job title={member.role} description={member.position} />,
    status: (
      <MDBox ml={-1}>
        <MDBadge
          badgeContent={member.status}
          color={member.status === "offline" ? "dark" : "success"}
          variant="gradient"
          size="sm"
        />
        {console.log(member.id)}
      </MDBox>
    ),
    createdAt: (
      <MDTypography component="a" href="#" variant="caption" color="text" fontWeight="medium">
        {member && member.createdAt.slice(0, 10)}
      </MDTypography>
    ),
    exp: (
      <MDTypography component="a" href="#" variant="caption" color="text" fontWeight="medium">
        {member && member.exp}
      </MDTypography>
    )
  }));

  return {
    columns,
    rows,
  };
}