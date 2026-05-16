// client/src/components/ui/Skeleton/Skeleton.jsx
import React from "react";
import styles from "./Skeleton.module.scss";
import clsx from "clsx";

const Skeleton = ({ width, height, variant = "rect", className }) => {
    return (
        <div
            className={clsx(styles.skeleton, styles[variant], className)}
            style={{ width, height }}
        />
    );
};

export default Skeleton;
