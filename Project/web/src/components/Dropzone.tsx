import { Box, List, ListItem, ListItemIcon, ListItemText } from "@mui/material";
import PropTypes from "prop-types";
import { useDropzone } from "react-dropzone";

const FileDropzone = (props) => {
  const {
    children,
    accept,
    imageS3,
    disabled,
    submitFile,
    files,
    getFilesFromEvent,
    maxFiles,
    maxSize,
    minSize,
    multiple,
    noClick,
    noDrag,
    noDragEventsBubbling,
    noKeyboard,
    onDrop,
    onDropAccepted,
    onDropRejected,
    onFileDialogCancel,
    onRemove,
    onRemoveAll,
    onUpload,
    preventDropOnDocument,
    resolution,
    ...other
  } = props;
  // We did not add the remaining props to avoid component complexity
  // but you can simply add it if you need to.
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept,
    maxFiles: 1,
    maxSize,
    disabled,
    multiple: false,
    minSize,
    onDrop,
  });

  return (
    <div {...other}>
      <Box
        sx={{
          alignItems: "center",
          border: 1,
          borderRadius: 1,
          borderColor: "divider",
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          outline: "none",
          p: 6,
          ...(isDragActive && {
            backgroundColor: "action.active",
            opacity: 0.5,
          }),
          "&:hover": {
            backgroundColor: "action.hover",
            cursor: "pointer",
            opacity: 0.5,
          },
        }}
        {...getRootProps()}
      >
        <input {...getInputProps()} />
      </Box>

      {files.length > 0 && (
        <Box sx={{ mt: 2 }}>
          <List>
            <ListItem
              key={useDropzone.path}
              sx={{
                border: 1,
                borderColor: "divider",
                borderRadius: 1,
                "& + &": {
                  mt: 1,
                },
              }}
            >
              <ListItemIcon>
                <DuplicateIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText
                primary={files[0].name}
                primaryTypographyProps={{
                  color: "textPrimary",
                  variant: "subtitle2",
                }}
                secondary={files[0].size}
              />
              {!imageS3 && submitFile && (
                /*  <div>
                   <CircularProgressbar
                     styles={{
                       root: { width: 35 },
                       path: { stroke: '#688eff' }
                     }}
                     strokeWidth={10}
                     value={60}
                   />
                 </div> */

                <LoadingWidget title="Enviando" />
              )}
            </ListItem>
          </List>
          <Box
            sx={{
              display: "flex",
              justifyContent: "flex-end",
              mt: 2,
            }}
          ></Box>
        </Box>
      )}
    </div>
  );
};

FileDropzone.propTypes = {
  accept: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.arrayOf(PropTypes.string),
  ]),
  disabled: PropTypes.bool,
  files: PropTypes.array,
  getFilesFromEvent: PropTypes.func,
  maxFiles: PropTypes.number,
  imageS3: PropTypes.string,
  maxSize: PropTypes.number,
  multiple: PropTypes.bool,
  noClick: PropTypes.bool,
  noDrag: PropTypes.bool,
  noDragEventsBubbling: PropTypes.bool,
  noKeyboard: PropTypes.bool,
  onDrop: PropTypes.func,
  onDropAccepted: PropTypes.func,
  onDropRejected: PropTypes.func,
  onFileDialogCancel: PropTypes.func,
  onRemove: PropTypes.func,
  onRemoveAll: PropTypes.func,
  onUpload: PropTypes.func,
  preventDropOnDocument: PropTypes.bool,
};

FileDropzone.defaultProps = {
  files: [],
};

export default FileDropzone;
